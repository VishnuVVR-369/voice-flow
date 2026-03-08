#![allow(unexpected_cfgs)]

use chrono::Utc;
use rdev::{grab, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::{self, BufRead, Write};
use std::sync::{LazyLock, Mutex, MutexGuard};
use std::thread;
use std::time::Duration;

#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use cocoa::foundation::{NSProcessInfo, NSString};
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct HotkeyCombo {
    keys: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "command")]
enum Command {
    #[serde(rename = "register_hotkeys")]
    RegisterHotkeys { hotkeys: Vec<HotkeyCombo> },
}

static REGISTERED_HOTKEYS: LazyLock<Mutex<Vec<HotkeyCombo>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));
static CURRENTLY_PRESSED: LazyLock<Mutex<Vec<String>>> = LazyLock::new(|| Mutex::new(Vec::new()));

#[cfg(target_os = "macos")]
fn prevent_app_nap() -> id {
    unsafe {
        let process_info = NSProcessInfo::processInfo(nil);
        let reason = NSString::alloc(nil)
            .init_str("Keyboard event monitoring requires continuous operation");
        let options: u64 = 0x00FFFFFF;
        let activity: id = msg_send![process_info, beginActivityWithOptions:options reason:reason];
        eprintln!("macOS App Nap prevention enabled for keyboard listener process");
        activity
    }
}

#[cfg(not(target_os = "macos"))]
fn prevent_app_nap() {}

fn main() {
    #[allow(clippy::let_unit_value)]
    let _activity = prevent_app_nap();

    thread::spawn(|| {
        let stdin = io::stdin();
        for line in stdin.lock().lines().map_while(Result::ok) {
            match serde_json::from_str::<Command>(&line) {
                Ok(command) => handle_command(command),
                Err(error) => eprintln!("Error parsing command: {}", error),
            }
        }
    });

    thread::spawn(|| {
        let mut heartbeat_id = 0u64;
        loop {
            thread::sleep(Duration::from_secs(10));
            heartbeat_id += 1;
            let heartbeat = json!({
                "type": "heartbeat_ping",
                "id": heartbeat_id.to_string(),
                "timestamp": Utc::now().to_rfc3339(),
            });
            println!("{}", heartbeat);
            flush_stdout();
        }
    });

    if let Err(error) = grab(callback) {
        eprintln!("Error: {:?}", error);
    }
}

fn handle_command(command: Command) {
    match command {
        Command::RegisterHotkeys { hotkeys } => {
            let mut registered_hotkeys = registered_hotkeys();
            *registered_hotkeys = hotkeys;
            eprintln!("Registered {} hotkeys", registered_hotkeys.len());
        }
    }

    flush_stdout();
}

fn should_block() -> bool {
    let hotkeys = registered_hotkeys().clone();
    let pressed_keys = pressed_keys().clone();

    hotkeys.iter().any(|hotkey| {
        !hotkey.keys.is_empty()
            && hotkey.keys.iter().all(|key| pressed_keys.contains(key))
            && hotkey.keys.len() == pressed_keys.len()
    })
}

fn callback(event: Event) -> Option<Event> {
    match event.event_type {
        EventType::KeyPress(key) => {
            let key_name = format!("{:?}", key);
            let normalized_key = normalize_key_name(&key_name);

            {
                let mut current_keys = pressed_keys();
                if !current_keys.contains(&normalized_key) {
                    current_keys.push(normalized_key.clone());
                }
            }

            output_event("keydown", &key);

            if should_block() {
                None
            } else if key_name == "Unknown(179)" && has_function_hotkey()
            {
                None
            } else {
                Some(event)
            }
        }
        EventType::KeyRelease(key) => {
            let normalized_key = normalize_key_name(&format!("{:?}", key));

            pressed_keys().retain(|pressed| pressed != &normalized_key);

            output_event("keyup", &key);
            Some(event)
        }
        _ => Some(event),
    }
}

fn output_event(event_type: &str, key: &Key) {
    let event = json!({
        "type": event_type,
        "key": format!("{:?}", key),
        "timestamp": Utc::now().to_rfc3339(),
        "raw_code": 0,
    });

    println!("{}", event);
    flush_stdout();
}

fn registered_hotkeys() -> MutexGuard<'static, Vec<HotkeyCombo>> {
    REGISTERED_HOTKEYS.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn pressed_keys() -> MutexGuard<'static, Vec<String>> {
    CURRENTLY_PRESSED
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn normalize_key_name(key_name: &str) -> String {
    if key_name == "Unknown(179)" {
        "Function".to_string()
    } else {
        key_name.to_string()
    }
}

fn has_function_hotkey() -> bool {
    registered_hotkeys()
        .iter()
        .any(|hotkey| hotkey.keys.iter().any(|key| key == "Function"))
}

fn flush_stdout() {
    if let Err(error) = io::stdout().flush() {
        eprintln!("Failed to flush stdout: {}", error);
    }
}
