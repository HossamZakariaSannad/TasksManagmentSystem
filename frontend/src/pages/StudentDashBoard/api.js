import axios from 'axios';

export const fetchStudentData = async () => {
  const studentId = localStorage.getItem('user_id');
  const authToken = localStorage.getItem('authToken');
const API_URL = import.meta.env.VITE_API_URL;

  if (!authToken || !studentId) {
    throw new Error('Missing authentication token or student ID');
  }

  const response = await axios.get(`${API_URL}/api/student/${studentId}/courses/`, {
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    timeout: 5000,
  });

  const [gradesResponse, ...submissionResponses] = await Promise.all([
    axios.get(`${API_URL}/api/grades/student/${studentId}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }),
    ...(response.data.assignments || []).map((assignment) =>
      axios
        .get(`${API_URL}/api/submission/assignment/${assignment.id}/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        .catch((error) => ({ error, data: { exists: false } }))
    ),
  ]);

  const grades = gradesResponse.data;
  const averageGrade = grades.length ? (grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length).toFixed(1) : null;

  const submissions = {};
  (response.data.assignments || []).forEach((assignment, index) => {
    const submission = submissionResponses[index];
    if (submission.data.exists && !submission.error) {
      submissions[assignment.id] = {
        submission_date: submission.data.submission_date,
        submitted: true,
      };
    }
  });

  return {
    student: response.data.student,
    courses: response.data.courses || [],
    assignments: response.data.assignments || [],
    grades: grades || [],
    averageGrade,
    submissions,
  };
};

export const submitAssignment = async (submissionData) => {
  const authToken = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('role');

  if (userRole !== 'student') {
    throw new Error('Only students can submit assignments');
  }

  return axios.post(`${API_URL}/api/submission/submit/`, submissionData, {
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
  });
};