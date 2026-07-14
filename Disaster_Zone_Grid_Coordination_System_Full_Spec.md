# Disaster Zone Grid Coordination System

## Complete Project Specification

## 1. Vision

Build a production-ready AI-powered disaster response platform that
enables emergency authorities to monitor disasters in real time,
prioritize rescue efforts using machine learning, and coordinate rescue
teams through an interactive GIS map.

------------------------------------------------------------------------

# User Roles

## Administrator

-   Manage disasters
-   Manage rescue teams
-   View analytics
-   Manage users

## Dispatcher

-   Assign teams
-   Update incidents
-   Track resources

## Rescue Team

-   Receive assignments
-   Update mission status
-   Share live location

## Public

-   Submit SOS requests
-   View verified alerts
-   Safety instructions

------------------------------------------------------------------------

# Major Modules

1.  Authentication (JWT)
2.  Interactive GIS Map
3.  Disaster Management
4.  Rescue Team Management
5.  Resource Inventory
6.  AI Priority Engine
7.  SOS Module
8.  Weather Integration
9.  Notification System
10. Reports & Analytics
11. Audit Logs

------------------------------------------------------------------------

# Database Tables

## users

id, name, email, password_hash, role

## disasters

id, title, disaster_type, description, latitude, longitude, severity,
radius, status, created_at

## grids

id, disaster_id, grid_code, severity, population, accessibility,
risk_level

## rescue_teams

id, name, members, equipment, current_latitude, current_longitude,
availability, status

## assignments

id, team_id, grid_id, priority, assigned_time, eta, status

## resources

id, resource_name, quantity, warehouse_location

## sos_requests

id, name, phone, latitude, longitude, message, status

------------------------------------------------------------------------

# Machine Learning

## Model

Random Forest Classifier

## Inputs

-   Severity
-   Population
-   Accessibility
-   Infrastructure Damage
-   Medical Need
-   Distance to Team
-   Weather Severity

## Output

Priority Score 1--100

## Training Pipeline

CSV Dataset ↓ Cleaning ↓ Feature Engineering ↓ Train/Test Split ↓ Random
Forest ↓ Model Evaluation ↓ Export model.pkl

------------------------------------------------------------------------

# REST API

## Authentication

POST /auth/login POST /auth/register POST /auth/logout

## Disaster

GET /disasters POST /disasters PUT /disasters/{id} DELETE
/disasters/{id}

## Grid

GET /grids PUT /grids/{id}

## Rescue Teams

GET /teams POST /teams PUT /teams/{id}

## Assignments

POST /assign GET /assignments

## SOS

POST /sos GET /sos

## AI

POST /predict-priority

## Dashboard

GET /dashboard

------------------------------------------------------------------------

# Frontend Pages

1.  Login
2.  Dashboard
3.  Interactive Map
4.  Disaster Details
5.  Rescue Teams
6.  Assignment Center
7.  Resource Inventory
8.  SOS Requests
9.  Analytics
10. Settings
11. Profile
12. Admin Panel

------------------------------------------------------------------------

# Interactive Map

Use Leaflet or Mapbox.

Each grid should display: - Color - Severity - Assigned Team -
Population - AI Score

Clicking a grid opens a side panel showing all information and available
actions.

------------------------------------------------------------------------

# Notifications

-   New disaster
-   SOS received
-   Team assigned
-   Mission completed
-   Critical alert

Support: - Email - In-app - WebSocket live updates

------------------------------------------------------------------------

# Analytics

Charts for: - Disaster count - Active teams - Resources used - Response
time - Severity distribution - Heatmap

------------------------------------------------------------------------

# Folder Structure

``` text
frontend/
  src/
    components/
    pages/
    hooks/
    services/
    context/
    assets/

backend/
  app/
    models/
    routes/
    schemas/
    services/
    ml/
    middleware/
    utils/
  data/
  trained_models/
  tests/
  requirements.txt

docker-compose.yml
README.md
```

------------------------------------------------------------------------

# README Contents

-   Overview
-   Features
-   Screenshots
-   Tech Stack
-   Installation
-   Environment Variables
-   API Documentation
-   Database Setup
-   ML Training
-   Deployment
-   Future Improvements

------------------------------------------------------------------------

# Antigravity Prompt

## Objective

Clone or create a new repository and build this application as a
production-ready full-stack project.

### Technical Requirements

-   React + Vite
-   Tailwind CSS
-   Flask
-   SQLAlchemy
-   PostgreSQL
-   JWT Authentication
-   Docker support
-   REST API
-   Leaflet/Mapbox
-   Random Forest (scikit-learn)
-   WebSockets for live updates

### UI Requirements

-   Modern dark theme
-   Responsive layout
-   Interactive full-screen map as the primary screen
-   Smooth animations using Framer Motion
-   Professional admin dashboard
-   Charts using Recharts
-   Accessible design

### Code Quality

-   Modular architecture
-   Type-safe where applicable
-   Centralized error handling
-   Logging
-   Validation
-   Environment variables
-   Unit tests
-   Production-ready Docker configuration

### Deliverables

-   Fully functional frontend
-   Fully functional backend
-   Trained ML model
-   Sample dataset
-   Database migrations
-   Seed data
-   API documentation
-   Complete README
-   Docker Compose
-   No placeholder code, mock APIs, or TODOs.
