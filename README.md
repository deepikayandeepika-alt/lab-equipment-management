# Lab Equipment Management System

## Project Description

Laboratory equipment is issued to students and staff, but traditional register-based tracking can make it difficult to identify who currently holds an instrument or whether it has been returned in good condition.

This project provides a simple digital equipment register that tracks issue and return records, identifies equipment that is still out, and warns the lab in-charge when a service or calibration date has passed.

## Technology Stack

- HTML5
- CSS3
- JavaScript
- JSON

No server backend or database is required. The application loads equipment data from a local JSON file.

## Project Structure

```text
lab-equipment-management
│
├── index.html
├── style.css
├── script.js
├── README.md
│
└── data
    └── equipment.json