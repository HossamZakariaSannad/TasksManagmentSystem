# Task Flow: AI-Powered Task and Project Management Tool 🚀

**Task Flow** is an advanced web-based solution, now enhanced with AI, designed to streamline project tracking, enhance team collaboration, and improve workflow efficiency. Initially built for ITI Egypt, its flexible architecture and powerful AI capabilities make it suitable for a wide range of learning organizations and hierarchical systems. This tool provides a structured approach to project management, ensuring better organization, task accountability, AI-assisted task creation, and real-time progress tracking.

**Status: MVP Ready & AI-Enhanced!** 🎉 This project has achieved its Minimum Viable Product stage, incorporating significant AI features, and is ready for use and further development.

---

## 🌟 Project Overview

Task Flow simplifies how users manage tasks, how team leaders or instructors oversee work, and how administrators monitor overall project execution. It centralizes task submissions, facilitates performance tracking, and now offers AI-powered assistance for assignment generation and learning support, catering to various program durations and organizational needs.

---

## 🤖 AI-Powered Features

Task Flow leverages cutting-edge AI to enhance productivity and learning:

1.  **Multi-Model AI Chatbot Assistant (via Together AI):**
    * **Technology:** Integrated with **Together AI**, providing access to **5 different large language models (LLMs)**.
    * **Users:** Assists **Supervisors, Instructors, and Students**.
    * **Functionality:**
        * **For Supervisors/Instructors:** Helps in brainstorming and drafting assignments, providing suggestions, and refining task descriptions.
        * **For Students:** Offers study assistance, answers questions about coursework, helps clarify concepts, and provides guidance on improving submissions.
2.  **Intelligent Assignment Generation (BERT Model):**
    * **Technology:** Utilizes a **BERT model** for deep contextual understanding.
    * **Users:** Empowers **Supervisors and Instructors**.
    * **Functionality:** Allows them to generate new assignment ideas or drafts by providing a brief description. The system then uses **cosine similarity** to analyze previous submissions and relevant content, suggesting relevant and well-structured assignment components.

---

## 🎯 Key Problems Addressed & Solutions

This tool tackles several key challenges:

1.  **Unorganized Task Submission:**
    * **Solution:** Centralizes all task submissions in one platform for easy access, review, and management.
2.  **Difficulty in Tracking Past Tasks and Performance:**
    * **Solution:** Organizes tasks under relevant categories, enabling quick access to past assignments and progress tracking.
3.  **Lack of Performance Evaluation and Self-Improvement Tracking:**
    * **Solution:** Provides a performance tracking feature for users to see evaluations and monitor progress. **AI chatbot** can offer personalized tips for improvement.
4.  **Long-Term Usability & Adaptability:**
    * **Solution:** Adaptable design for various programs/projects, with consistent access to records.
5.  **Efficient Assignment Creation & Learning Support:**
    * **Problem:** Instructors spending significant time creating new assignments; students needing readily available study support.
    * **Solution:** **AI-powered assignment generation** assists instructors, while the **AI chatbot** provides on-demand support for students.

---

## ✨ Core Objectives

* Enable users (e.g., students, employees) to manage their tasks effectively and track project progress.
* Allow team leaders/instructors (admins) to oversee tasks, assign work efficiently with **AI assistance**, and provide feedback.
* Provide higher-level administrators with tools to manage permissions, monitor overall system execution, and leverage **AI for content generation support**.
* Enhance collaboration through notifications, role-based access, and reporting features.
* Offer a user-friendly interface with integrated **AI tools** for easy navigation and enhanced task management.
* Provide **AI-driven support** for students to aid their learning process.

---

## 💡 Scalability & Applicability

Task Flow's AI-enhanced, scalable design is suitable for:

* **Educational Institutions:** Schools, colleges, universities (AI for assignment creation, student support).
* **Startups & Small Businesses:** For internal project management and AI-assisted content creation.
* **Training Centers:** To manage assignments, track trainee progress, and offer AI study aids.
* **Any Hierarchical System:** Organizations needing structured task management with AI-boosted efficiency.

The multi-tiered role system (Superadmin → Branch Manager → Supervisor → Instructor → Student) allows flexible adaptation.

---

## 📊 SWOT Analysis

**Strengths:**
* **Advanced AI Assistance:** Integrated multi-model chatbot (Together AI) and BERT-based assignment generation significantly enhance productivity and support.
* **Centralized Platform:** Simplifies task submission, tracking, and review.
* **Performance Tracking:** Enables users and managers to monitor progress.
* **Role-Based Access Control:** Clear roles ensure appropriate permissions.
* **MVP Ready & AI-Enhanced:** Core functionalities with significant AI features are implemented.
* **User-Friendly Interface:** Designed for ease of use, now with intuitive AI tools.
* **Adaptable & Scalable:** Suitable for various organizational structures and sizes.

**Weaknesses:**
* **Complexity of AI Integration:** Maintaining and updating multiple AI models and their integrations can be complex.
* **Resource Intensity:** AI features, especially LLMs, can be resource-intensive (API costs, processing power).
* **Dependency on External APIs:** Reliance on services like Together AI for some core AI functionalities.
* **Initial Focus:** While adaptable, deep customization for very niche organizations might require further work.

**Opportunities:**
* **Further AI Specialization:** Developing more domain-specific AI tools within the platform.
* **Adoption by Diverse Organizations:** Increased appeal due to advanced AI features.
* **Open-Source Collaboration:** Attract developers interested in AI and EdTech.
* **Data-Driven AI Improvements:** Leveraging anonymized interaction data to further refine AI model performance (with privacy considerations).

**Threats:**
* **Rapid AI Evolution:** Need to keep pace with fast-changing AI technologies and models.
* **Competition:** Established tools are also increasingly integrating AI.
* **Ethical AI Considerations:** Ensuring responsible AI use, data privacy, and bias mitigation in AI-generated content.
* **Cost of AI Services:** Potential for increasing costs of third-party AI APIs.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React.js
* **UI Components:** MUI, Tailwind CSS
* **Data Visualization:** Recharts / Chart.js / D3.js
* **Real-time Notifications:** WebSockets

### Backend
* **Framework:** FastAPI (Python-Based)
* **Asynchronous Tasks:** Celery + Redis
* **AI Models/Libraries:**
    * **BERT Model**  for assignment generation.
* **AI Services Integration:**
    * **Together AI API** (for accessing 5 different LLMs for chatbot functionality).

### Database
* **Primary:** PostgreSQL

---

## ☁️ Deployment

* **Backend:** Deployed on [Render](https://render.com/)
* **Frontend:** Deployed on [Vercel](https://vercel.com/)

---

## 🌐 Live Demo

You can access the live application here: **[Task Flow](https://tasks-managment-system.vercel.app/)**

---

##  Roles & Workflow 

The system features a hierarchical role structure, with AI tools available to various roles:

1.  **Superadmin:** Overall system setup, manages **Branch Managers**.
2.  **Branch Manager:** Manages a branch/department, manages **Supervisors**. Can utilize **AI Chatbot** for administrative tasks.
3.  **Supervisor:** Manages **Instructors/Team Leaders**. Monitors activities, generates reports. Can use **AI Chatbot** for planning and **BERT model** for overseeing assignment quality/creation.
4.  **ITI Instructor / Team Leader (Admin Role):**
    * Creates and assigns tasks, potentially using the **BERT-based assignment generation tool** for new ideas or the **AI Chatbot** for drafting.
    * Monitors student progress, provides feedback (can consult **AI Chatbot** for feedback phrasing).
5.  **ITI Student / User:**
    * Manages assigned tasks, updates progress.
    * Utilizes the **AI Chatbot** for study help, understanding assignments, and drafting responses.

**General Workflow Example:**

1.  System setup by **Superadmin**, who adds **Branch Managers**.
2.  **Branch Managers** add **Supervisors**.
3.  **Supervisors** add **Instructors**, leveraging **AI tools** for planning.
4.  **Instructors** create projects & tasks, using **BERT model** and **AI Chatbot** for assistance → Assigns to **Students**.
5.  **Students** work on tasks, update progress, utilize **AI Chatbot** for study support → Request review.
6.  **Instructors** review, provide feedback (possibly informed by **AI Chatbot** suggestions) → Approve/request changes.
7.  All admin levels monitor progress; **AI tools** can assist in summarizing data or drafting reports.
8.  Task completion → Stored for records & analysis.

---


This README provides a comprehensive overview of the AI-enhanced **Task Flow** project.
