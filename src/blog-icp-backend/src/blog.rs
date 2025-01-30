use ic_cdk::api::time;
use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk::export::Principal;
use serde::Serialize;

#[derive(Clone, CandidType, Deserialize, Serialize, Debug)]
pub struct Comment {
    pub id: u64,
    pub owner: Principal,
    pub content: String,
    pub date: u64,
}

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
    pub fn new(id: u64, owner: Principal, content: String) -> Self {
        Self {
            id,
            owner,
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