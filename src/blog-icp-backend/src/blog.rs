use ic_cdk::api::{time, caller};
use ic_cdk::export::Principal;
use serde::{Deserialize, Serialize};
use candid::CandidType;

#[derive(Clone, CandidType, Deserialize, Serialize, Debug)]
pub struct Comment {
    pub id: u64,
    pub content: String,
    pub date: u64,
}

// Wpis blogowy
#[derive(Clone, CandidType, Deserialize, Serialize, Debug)]
pub struct Blog {
    pub id: u64,
    pub owner: Principal,
    pub title: String,
    pub date: u64, 
    pub content: String,
    pub tags: Vec<String>,
    pub comments: Vec<Comment>,
}

impl Comment {
    pub fn new(id: u64, content: String) -> Self {
        Self {
            id,
            content,
            date: time(),
        }
    }
}

impl Blog {
    pub fn new(id: u64, owner: Principal, title: String, content: String, tags: Vec<String>) -> Self {
        Self {
            id,
            owner,
            title,
            date: time(),
            content,
            tags,
            comments: Vec::new(),
        }
    }
}
