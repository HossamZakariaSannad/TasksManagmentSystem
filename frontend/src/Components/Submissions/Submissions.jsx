import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  Snackbar,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import apiClient from "../../services/api";

const Submissions = () => {
  const instructorId = useSelector((state) => state.auth.user_id);
  const [loading, setLoading] = useState({
    initial: true,
    assignments: false,
    submissions: false,
    intakes: false,
  });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ tracks: [], courses: [], trackCourses: [] });
  const [intakes, setIntakes] = useState([]);
  const [intakeCourses, setIntakeCourses] = useState({});
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissionData, setSubmissionData] = useState({
    submitters: [],
    submitted_count: 0,
    not_submitted_count: 0,
  });
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [existingEvaluations, setExistingEvaluations] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch tracks, courses, and intakes on mount
  useEffect(() => {
    const fetchTracksAndCourses = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));
        const response = await apiClient.get(
          `staff/track-and-courses/${instructorId}/`
        );

        // Fetch intakes
        setLoading((prev) => ({ ...prev, intakes: true }));
        const intakeResponse = await apiClient.get('/student/intakes/');
        const fetchedIntakes = Array.isArray(intakeResponse.data.intakes)
          ? intakeResponse.data.intakes
          : [];
        setIntakes(fetchedIntakes);

        // Fetch courses for each intake
        const fetchedIntakeCourses = {};
        await Promise.all(
          fetchedIntakes.map(async (intake) => {
            try {
              const intakeCoursesResponse = await apiClient.get(
                `/courses/intakes/${intake.id}/courses/`
              );
              fetchedIntakeCourses[intake.id] = Array.isArray(intakeCoursesResponse.data)
                ? intakeCoursesResponse.data
                : [];
            } catch (error) {
              console.warn(`Failed to fetch courses for intake ${intake.id}:`, error);
              fetchedIntakeCourses[intake.id] = [];
            }
          })
        );
        setIntakeCourses(fetchedIntakeCourses);

        // Enrich courses with intake data
        const courses = (response.data.courses || response.data.taught_courses || []).map((course) => {
          let intake = null;
          for (const intakeId in fetchedIntakeCourses) {
            const coursesInIntake = fetchedIntakeCourses[intakeId];
            if (coursesInIntake.some((c) => c.id === course.id)) {
              const matchingIntake = fetchedIntakes.find((i) => i.id === parseInt(intakeId));
              if (matchingIntake) {
                intake = { id: matchingIntake.id, name: matchingIntake.name };
                break;
              }
            }
          }
          return {
            ...course,
            intake,
          };
        });

        setData({
          tracks: response.data.tracks || [],
          courses,
          trackCourses: response.data.track_courses || [],
        });
        setError(null);
      } catch (err) {
        setError("Failed to fetch tracks, courses, or intakes");
      } finally {
        setLoading((prev) => ({ ...prev, initial: false, intakes: false }));
      }
    };
    fetchTracksAndCourses();
  }, [instructorId]);

  // Fetch assignments when track and course are selected
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedTrack || !selectedCourse) return;

      try {
        setLoading((prev) => ({ ...prev, assignments: true }));
        const response = await apiClient.get(
          `assignments/track/${selectedTrack}/course/${selectedCourse}/assignments/`
        );
        setAssignments(response.data.assignments);
      } catch (err) {
        setError("Failed to fetch assignments");
      } finally {
        setLoading((prev) => ({ ...prev, assignments: false }));
      }
    };
    fetchAssignments();
  }, [selectedTrack, selectedCourse]);

  const fetchSubmissionStatus = async (assignmentId) => {
    try {
      setLoading((prev) => ({ ...prev, submissions: true }));
      const response = await apiClient.get(
        `assignments/${assignmentId}/track/${selectedTrack}/course/${selectedCourse}/submitters/`
      );

      // Process all students (both submitters and non-submitters)
      const allStudents = [
        ...(response.data.submitters || []),
        ...(response.data.non_submitters || []).map(s => ({ ...s, submitted: false }))
      ];

      const processedStudents = await Promise.all(
        allStudents.map(async (student) => {
          try {
            let submission = {};
            let submissionId = null;
            let fileUrl = null;
            let submissionDate = null;

            // Try to get submission data
            try {
              const submissionRes = await apiClient.get(
                `submission/assignments/${assignmentId}/students/${student.student_id}/`
              );
              if (submissionRes.data?.submission) {
                submission = submissionRes.data.submission;
                submissionId = submission.id;
                fileUrl = submission.file_url;
                submissionDate = submission.submission_time;
              }
            } catch (submissionError) {
              console.log('Primary submission fetch failed, trying alternative endpoint');
              try {
                const altRes = await apiClient.get(
                  `submission/instructor/?student=${student.student_id}&assignment=${assignmentId}`
                );
                // console.log("altRes",altRes);
                
                if (altRes.data) {
                  // console.log("altRes inside",altRes);

                  submission = altRes.data[0];
                  submissionId = submission.id;
                  fileUrl = submission.file_url;
                  submissionDate = submission.submission_date;
                }
              } catch (altError) {
                console.log('Alternative submission fetch failed');
              }
            }
            
            // Check if the student is marked as submitted in the original response
            const isSubmitted = response.data.submitters.some(
              s => s.student_id === student.student_id
            );

            // Get existing grade if any
            let existingGrade = null;
            try {
              const gradeRes = await apiClient.get(
                `grades/student/${student.student_id}/?assignment=${assignmentId}`
              );
              existingGrade = gradeRes.data[0] || null;
            } catch (gradeError) {
              console.error('Grade fetch error:', gradeError);
            }

            return {
              ...student,
              submitted: isSubmitted || !!fileUrl,
              submission_id: submissionId,
              submission_date: submissionDate,
              file_url: fileUrl,
              existingGrade,
            };
          } catch (err) {
            console.error('Error processing student:', student.student_id, err);
            return {
              ...student,
              submitted: false,
              submission_id: null,
              file_url: null,
              submission_date: null,
              existingGrade: null
            };
          }
        })
      );

      // Separate back into submitters and non-submitters based on actual submission status
      const submitters = processedStudents.filter(s => s.submitted);
      const non_submitters = processedStudents.filter(s => !s.submitted);

      // Prepare feedback and grades from existing evaluations
      const evaluations = {};
      const initialFeedback = {};
      const initialGrades = {};

      processedStudents.forEach((student) => {
        if (student.existingGrade) {
          evaluations[student.student_id] = student.existingGrade;
          initialFeedback[student.student_id] = student.existingGrade.feedback || '';
          initialGrades[student.student_id] = student.existingGrade.score?.toString() || '';
        }
      });

      setExistingEvaluations(evaluations);
      setFeedback(initialFeedback);
      setGrades(initialGrades);
      setSubmissionData({
        submitters,
        non_submitters,
        submitted_count: submitters.length,
        not_submitted_count: non_submitters.length
      });
    } catch (err) {
      console.error('Error fetching submission status:', err);
      setError("Failed to fetch submission data");
    } finally {
      setLoading((prev) => ({ ...prev, submissions: false }));
    }
  };

  // Handlers
  const handleTrackChange = (event) => {
    setSelectedTrack(event.target.value);
    setSelectedCourse("");
    setSelectedAssignment("");
    setSubmissionData({ submitters: [], non_submitters: [] });
  };

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSelectedAssignment("");
    setSubmissionData({ submitters: [], non_submitters: [] });
  };

  const handleAssignmentChange = (event) => {
    const assignmentId = event.target.value;
    setSelectedAssignment(assignmentId);
    fetchSubmissionStatus(assignmentId);
  };

  const handleAccordionChange = (studentId) => (event, isExpanded) => {
    setExpandedStudent(isExpanded ? studentId : null);
  };

  const handleFeedbackChange = (studentId) => (e) =>
    setFeedback({ ...feedback, [studentId]: e.target.value });

  const handleGradeChange = (studentId) => (e) =>
    setGrades({ ...grades, [studentId]: e.target.value });

  const handleSubmitFeedback = async (studentId) => {
    try {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));

      if (!selectedTrack || !selectedCourse || !selectedAssignment) {
        throw new Error("Missing required context (track, course, or assignment)");
      }

      const student = [...submissionData.submitters, ...(submissionData.non_submitters || [])]
        .find(s => s.student_id === studentId);

      if (!student) {
        throw new Error("Student not found in submission records");
      }

      // Try to get submission ID through multiple methods
      let submissionId = student.submission_id;

      // Method 1: Check existing evaluation
      if (!submissionId && existingEvaluations[studentId]?.submission) {
        submissionId = existingEvaluations[studentId].submission;
      }

      // Method 2: Try to get from API directly
      if (!submissionId && student.submitted) {
        try {
          const submissionRes = await apiClient.get(
            `submission/for-student/${studentId}/assignment/${selectedAssignment}/`
          );
          submissionId = submissionRes.data.id;
        } catch (apiError) {
          console.log('Direct submission fetch failed, trying alternative');
        }
      }

      // Method 3: If we have file URL but no ID, try to submit without submission ID
      if (!submissionId && student.file_url) {
        console.warn('Proceeding without submission ID but with file URL');
      }

      // Validate grade input
      const rawScore = grades[studentId];
      const numericScore = parseFloat(rawScore);

      if (isNaN(numericScore)) {
        throw new Error("Please enter a valid numerical grade");
      }

      if (numericScore < 0 || numericScore > 10) {
        throw new Error("Grade must be between 0 and 10");
      }

      // Prepare payload - make submission ID optional
      const payload = {
        score: numericScore,
        feedback: feedback[studentId]?.trim() || "",
        student: studentId,
        assignment: selectedAssignment,
        course: selectedCourse,
        track: selectedTrack,
        ...(submissionId && { submission: submissionId }),
        ...(student.file_url && { file_url: student.file_url })
      };

      // Determine endpoint and method
      const endpoint = existingEvaluations[studentId]
        ? `grades/${existingEvaluations[studentId].id}/`
        : "grades/";

      const method = existingEvaluations[studentId] ? "put" : "post";

      // Submit the evaluation
      await apiClient[method](endpoint, payload);

      // Refresh the submission data
      await fetchSubmissionStatus(selectedAssignment);

      setSnackbar({
        open: true,
        message: `Evaluation ${existingEvaluations[studentId] ? "updated" : "submitted"} successfully`,
        severity: "success",
      });

      if (!existingEvaluations[studentId]) {
        setFeedback(prev => ({ ...prev, [studentId]: "" }));
        setGrades(prev => ({ ...prev, [studentId]: "" }));
      }

    } catch (err) {
      console.error("Grade submission error:", {
        error: err.message,
        stack: err.stack,
        response: err.response?.data
      });

      let userMessage = err.response?.data?.detail || err.message.replace(/Error: /, '');

      // Special handling for submission creation errors
      if (err.message.includes('submission record')) {
        userMessage = `Could not verify submission for ${student.name}. The grade was saved but you may need to manually verify the submission later.`;
      }

      setSnackbar({
        open: true,
        message: userMessage,
        severity: "error",
      });
    } finally {
      setSubmitLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Filter courses for selected track
  const filteredCourses = data?.courses?.filter((course) =>
    course.tracks.some((track) => track.id === Number(selectedTrack))
  );

  // Student filtering
  const mergedStudents = [
    ...(submissionData.submitters || []),
    ...(submissionData.non_submitters || []).map((s) => ({
      ...s,
      submitted: false,
      submission_date: null,
      file_url: null,
    })),
  ];

  const filteredStudents = [
    ...(submissionData.submitters || []),
    ...(submissionData.non_submitters || [])
  ].filter((student) =>
    statusFilter === "all"
      ? true
      : statusFilter === "submitted"
        ? student.submitted
        : !student.submitted
  );
console.log("filterd",filteredStudents);
console.log("not filterd",submissionData);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Student Submissions
      </Typography>

      {/* Selection Grids */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Track</InputLabel>
            <Select
              value={selectedTrack}
              onChange={handleTrackChange}
              label="Select Track"
              disabled={loading.initial || loading.intakes}
            >
              <MenuItem value=""><em>Select Track</em></MenuItem>
              {data.tracks.map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={handleCourseChange}
              label="Select Course"
              disabled={!selectedTrack || loading.assignments || loading.intakes}
            >
              <MenuItem value=""><em>Select Course</em></MenuItem>
              {loading.initial || loading.intakes ? (
                <MenuItem disabled>Loading courses...</MenuItem>
              ) : filteredCourses?.length === 0 ? (
                <MenuItem disabled>No courses available</MenuItem>
              ) : (
                filteredCourses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name} Intake({course.intake?.name || 'No Intake'})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Assignment</InputLabel>
            <Select
              value={selectedAssignment}
              onChange={handleAssignmentChange}
              label="Select Assignment"
              disabled={!selectedCourse || loading.assignments}
            >
              <MenuItem value=""><em>Select Assignment</em></MenuItem>
              {assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={12}>
          <FormControl fullWidth>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="all">All Students</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="not-submitted">Not Submitted</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Loading and Error States */}
      {(loading.initial || loading.intakes) && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading initial data...</Typography>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Submissions List */}
      {submissionData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {filteredStudents.length} students (
            {submissionData.submitted_count} submitted,{" "}
            {submissionData.not_submitted_count} not submitted)
          </Typography>

          {filteredStudents.map((student) => (
            <Accordion
              key={student.student_id}
              expanded={expandedStudent === student.student_id}
              onChange={handleAccordionChange(student.student_id)}
              sx={{ mb: 2, boxShadow: 3 }}
            >
          
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PersonIcon />
                    <Typography>{student.name}</Typography>
                    <Chip
                      label={student.submitted ? "Submitted" : "Not Submitted"}
                      color={student.submitted ? "success" : "error"}
                      icon={student.submitted ? <CheckCircleIcon /> : <CancelIcon />}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Submission Details</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {student.submitted ? (
                      <>
                        <Typography variant="body2">
                          Submitted: {student.submission_date
                            ? new Date(student.submission_date).toLocaleString()
                            : 'Date not available'}
                        </Typography>
                        {student.file_url && (
                          <Button
                            variant="outlined"
                            startIcon={<FileIcon />}
                            href={student.file_url}
                            target="_blank"
                            sx={{ mt: 1 }}
                          >
                            View Submission
                          </Button>
                        )}
                      </>
                    ) : (
                      <Typography color="text.secondary">No submission found</Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Evaluation</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {student.submitted ? (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Feedback"
                          value={feedback[student.student_id] || ""}
                          onChange={handleFeedbackChange(student.student_id)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          type="number"
                          label="Grade (0-10)"
                          inputProps={{ min: 0, max: 10 }}
                          value={grades[student.student_id] || ""}
                          onChange={handleGradeChange(student.student_id)}
                          sx={{ mb: 2 }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleSubmitFeedback(student.student_id)}
                          disabled={submitLoading[student.student_id]}
                        >
                          {submitLoading[student.student_id] ? (
                            <CircularProgress size={24} sx={{ color: "#fff" }} />
                          ) : existingEvaluations[student.student_id] ? (
                            "Update Evaluation"
                          ) : (
                            "Submit Evaluation"
                          )}
                        </Button>
                        {existingEvaluations[student.student_id] && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Last updated:{" "}
                            {new Date(
                              existingEvaluations[student.student_id].graded_date
                            ).toLocaleString()}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          type="number"
                          label="Grade"
                          value={0}
                          disabled
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Feedback"
                          value="No submission available"
                          disabled
                          sx={{ mb: 2 }}
                        />
                      </>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Submissions;