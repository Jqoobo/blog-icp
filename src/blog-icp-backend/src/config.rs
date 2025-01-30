use candid::{CandidType, Deserialize};
use std::cell::RefCell;

#[derive(Clone, CandidType, Deserialize, Debug)]
pub struct Config {
    pub max_tags_count: u8,
    pub max_content_len: u16,
    pub max_title_len: u8,
    pub tags: Vec<String>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            max_tags_count: 3,
            max_content_len: 2000,
            max_title_len: 250,
            tags: Vec::new(),
        }
    }

    pub fn remove_tag(&mut self, tag: &str) -> Result<(), String> {
        if !self.tags.contains(&tag.to_string()) {
            return Err(format!("Tag \"{}\" not found", tag));
        }
        self.tags.retain(|t| t != tag);
        Ok(())
    }
}
