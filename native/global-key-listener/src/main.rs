use chrono::Utc;
use rdev::{grab, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::{self, BufRead, Write};
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

#[allow(static_mut_refs)]
static mut REGISTERED_HOTKEYS: Vec<HotkeyCombo> = Vec::new();
#[allow(static_mut_refs)]
static mut CURRENTLY_PRESSED: Vec<String> = Vec::new();

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
            io::stdout().flush().unwrap();
        }
    });

    if let Err(error) = grab(callback) {
        eprintln!("Error: {:?}", error);
    }
}

fn handle_command(command: Command) {
    match command {
        Command::RegisterHotkeys { hotkeys } => unsafe {
            REGISTERED_HOTKEYS = hotkeys;
            eprintln!("Registered {} hotkeys", REGISTERED_HOTKEYS.len());
        },
    }

    io::stdout().flush().unwrap();
}

fn should_block() -> bool {
    unsafe {
        for hotkey in &REGISTERED_HOTKEYS {
            let all_pressed = hotkey
                .keys
                .iter()
                .all(|key| CURRENTLY_PRESSED.contains(key));
            let same_length = hotkey.keys.len() == CURRENTLY_PRESSED.len();

            if all_pressed && !hotkey.keys.is_empty() && same_length {
                return true;
            }
        }

        false
    }
}

fn callback(event: Event) -> Option<Event> {
    match event.event_type {
        EventType::KeyPress(key) => {
            let key_name = format!("{:?}", key);
            let normalized_key = if key_name == "Unknown(179)" {
                "Function".to_string()
            } else {
                key_name.clone()
            };

            unsafe {
                if !CURRENTLY_PRESSED.contains(&normalized_key) {
                    CURRENTLY_PRESSED.push(normalized_key);
                }
            }

            output_event("keydown", &key);

            if should_block() {
                None
            } else if key_name == "Unknown(179)"
                && unsafe {
                    REGISTERED_HOTKEYS
                        .iter()
                        .any(|hotkey| hotkey.keys.contains(&"Function".to_string()))
                }
            {
                None
            } else {
                Some(event)
            }
        }
        EventType::KeyRelease(key) => {
            let key_name = format!("{:?}", key);
            let normalized_key = if key_name == "Unknown(179)" {
                "Function".to_string()
            } else {
                key_name
            };

            unsafe {
                CURRENTLY_PRESSED.retain(|pressed| pressed != &normalized_key);
            }

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
    io::stdout().flush().unwrap();
}
