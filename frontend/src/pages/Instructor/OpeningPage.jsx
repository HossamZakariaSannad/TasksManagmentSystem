import React, { useEffect, useState } from "react";
import {
  FiBook,
  FiFileText,
  FiUploadCloud,
  FiMessageSquare,
} from "react-icons/fi";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  useTheme,
  useMediaQuery,
  Alert,
  Skeleton,
  Grow,
  Slide,
  Fade,
  styled,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import apiClient from "../../services/api";

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[6],
  },
}));

const OpeningPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user_id } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    tracks: [],
    courses: [],
    assignments: [],
    submissions: [],
    pendingFeedback: [],
    students: new Map(),
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all students first
        const studentsRes = await apiClient.get("/student/list/");
        const studentsData = studentsRes.data?.students || [];
        const studentsMap = new Map(
          studentsData.map((student) => [student.id, student])
        );
        console.log("Fetched students:", studentsData);

        // Fetch instructor's tracks and courses
        const tracksCoursesRes = await apiClient.get(
          `/staff/track-and-courses/${user_id}/`
        );
        const tracks = tracksCoursesRes.data?.tracks || [];
        const courses = tracksCoursesRes.data?.courses || [];
        console.log("Fetched tracks and courses:", { tracks, courses });

        // Fetch all assignments by looping over tracks and courses
        const allAssignments = [];
        await Promise.all(
          tracks.map(async (track) => {
            const trackCourses = courses.filter((course) =>
              course.tracks?.some((t) => t.id === track.id)
            );
            await Promise.all(
              trackCourses.map(async (course) => {
                try {
                  const response = await apiClient.get(
                    `assignments/track/${track.id}/course/${course.id}/assignments/`
                  );
                  const assignments = response.data.assignments || [];
                  allAssignments.push(
                    ...assignments.map((assignment) => ({
                      ...assignment,
                      trackId: track.id, // Store track ID
                      trackName: track.name,
                      courseId: course.id, // Store course ID
                      courseName: course.name,
                    }))
                  );
                } catch (err) {
                  console.error(
                    `Failed to fetch assignments for track ${track.id} and course ${course.id}:`,
                    err
                  );
                }
              })
            );
          })
        );
        console.log("All assignments:", allAssignments);

        // Fetch all submissions for the instructor across all assignments
        const allSubmissions = [];
        await Promise.all(
          allAssignments.map(async (assignment) => {
            try {
              console.log(`Fetching submitters for assignment ${assignment.id} with track ${assignment.trackId} and course ${assignment.courseId}`);
              const response = await apiClient.get(
                `assignments/${assignment.id}/track/${assignment.trackId}/course/${assignment.courseId}/submitters/`
              );
              console.log(`Submitters response for assignment ${assignment.id}:`, response.data);
              const submitters = (response.data.submitters || []).map((student) => ({
                ...student,
                assignment_id: assignment.id,
                assignment_title: assignment.title,
              }));
              const nonSubmitters = (response.data.non_submitters || []).map((student) => ({
                ...student,
                assignment_id: assignment.id,
                assignment_title: assignment.title,
                submitted: false,
              }));

              // Fetch submission details for each submitter
              const processedStudents = await Promise.all(
                [...submitters, ...nonSubmitters].map(async (student) => {
                  try {
                    let submission = {};
                    let submissionId = null;
                    let fileUrl = null;
                    let submissionDate = null;

                    // Try to get submission data
                    try {
                      const submissionRes = await apiClient.get(
                        `submission/assignments/${student.assignment_id}/students/${student.student_id}/`
                      );
                      console.log(`Submission response for student ${student.student_id}:`, submissionRes.data);
                      if (submissionRes.data?.submission) {
                        submission = submissionRes.data.submission;
                        submissionId = submission.id;
                        fileUrl = submission.file_url;
                        submissionDate = submission.submission_time;
                      }
                    } catch (submissionError) {
                      console.log('Primary submission fetch failed for student:', student.student_id, submissionError.message);
                    }

                    if (!fileUrl) {
                      try {
                        const altRes = await apiClient.get(
                          `submission/instructor/?student=${student.student_id}&assignment=${student.assignment_id}`
                        );
                        console.log(`Alternative submission response for student ${student.student_id}:`, altRes.data);
                        if (altRes.data?.results?.[0]) {
                          submission = altRes.data.results[0];
                          submissionId = submission.id;
                          fileUrl = submission.file_url;
                          submissionDate = submission.submission_time;
                        }
                      } catch (altError) {
                        console.log('Alternative submission fetch failed for student:', student.student_id, altError.message);
                      }
                    }

                    const isSubmitted = submitters.some(
                      (s) => s.student_id === student.student_id
                    );
                    console.log(`Student ${student.student_id}: isSubmitted=${isSubmitted}, fileUrl=${fileUrl}`);

                    return {
                      ...student,
                      submitted: isSubmitted || !!fileUrl,
                      submission_id: submissionId,
                      submission_date: submissionDate,
                      file_url: fileUrl,
                    };
                  } catch (err) {
                    console.error('Error processing student:', student.student_id, err);
                    return {
                      ...student,
                      submitted: false,
                      submission_id: null,
                      file_url: null,
                      submission_date: null,
                    };
                  }
                })
              );

              // Add only submitted students to allSubmissions
              const submittedStudents = processedStudents.filter((s) => s.submitted);
              console.log(`Submitted students for assignment ${assignment.id}:`, submittedStudents);
              allSubmissions.push(...submittedStudents);
            } catch (err) {
              console.error('Error fetching submissions for assignment:', assignment.id, err);
            }
          })
        );

        // Sort submissions by date (most recent first)
        allSubmissions.sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date));
        console.log("All submissions:", allSubmissions);

        setDashboardData({
          tracks,
          courses,
          assignments: allAssignments,
          submissions: allSubmissions.map((sub) => ({
            ...sub,
            status: sub.feedback ? "Reviewed" : "Pending",
          })),
          pendingFeedback: allSubmissions.filter((s) => !s.feedback),
          students: studentsMap,
        });

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    if (user_id) fetchDashboardData();
  }, [user_id]);


  // Generate chart data
  const submissionsData = dashboardData.submissions.reduce(
    (acc, submission) => {
      const date = new Date(submission.submission_date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {}
  );

  const chartData = Object.entries(submissionsData).map(([date, count]) => ({
    date,
    count,
  }));

  // Calculate active assignments based on end date
  const activeAssignments = dashboardData.assignments.filter((assignment) => {
    const now = new Date();
    const endDate = new Date(assignment.end_date);
    return now < endDate;
  });

  // Stats Section
  const stats = [
    {
      title: "Total Courses",
      value: dashboardData.courses.length,
      icon: <FiBook />,
      color: theme.palette.primary.main,
    },
    {
      title: "Active Assignments",
      value: activeAssignments.length,
      icon: <FiFileText />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Submissions",
      value: dashboardData.submissions.length,
      icon: <FiUploadCloud />,
      color: theme.palette.success.main,
    },
    {
      title: "Pending Feedback",
      value: dashboardData.pendingFeedback.length,
      icon: <FiMessageSquare />,
      color: theme.palette.warning.main,
    },
  ];

  // Prepare recent submissions (all submitted students)
  const recentActivity = dashboardData.submissions
    .map((submission) => {
      const student = dashboardData.students.get(submission.student_id);
      return {
        ...submission,
        studentName: student
          ? `${student.first_name} ${student.last_name}`
          : `Student ${submission.student_id}`,
        assignmentTitle: submission.assignment_title || "Assignment",
      };
    })
    .slice(0, 3); // Limit to 3 for display

  const StatsSkeleton = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[1, 2, 3, 4].map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item}>
          <Skeleton
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 2 }}
          />
        </Grid>
      ))}
    </Grid>
  );

  const RecentActivitySkeleton = () => (
    <Card sx={{ boxShadow: theme.shadows[3], height: 400 }}>
      <CardContent>
        <Skeleton variant="text" width={200} height={40} />
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="rectangular" width="80%" height={60} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: isMobile ? 2 : 4 }}>
        <Skeleton variant="text" width={300} height={60} />
        <Skeleton variant="text" width={250} height={30} sx={{ mb: 4 }} />
        <StatsSkeleton />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <RecentActivitySkeleton />
          </Grid>
          <Grid item xs={12} md={6}>
            <RecentActivitySkeleton />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Fade in>
        <Box sx={{ p: isMobile ? 2 : 4 }}>
          <Alert
            severity="error"
            sx={{
              background: theme.palette.error.dark,
              color: theme.palette.error.contrastText,
              borderRadius: 2,
              boxShadow: theme.shadows[3],
            }}
          >
            {error}
          </Alert>
        </Box>
      </Fade>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      {/* Header Section */}
      <Slide in direction="down">
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {dashboardData.tracks[0] &&
              typeof dashboardData.tracks[0].instructor === "string"
              ? dashboardData.tracks[0].instructor.split(" ")[0].toUpperCase()
              : "Instructor"}{" "}
            Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Managing {dashboardData.courses.length} courses
          </Typography>
        </Box>
      </Slide>

      {/* Submissions Timeline */}
      <Slide in direction="down">
        <AnimatedCard
          sx={{
            mb: 4,
            height: 300,
            transition: theme.transitions.create(["transform", "box-shadow"], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: theme.shadows[6],
            },
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Submissions Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </AnimatedCard>
      </Slide>

      {/* Stats Grid */}
      <Grow in timeout={500}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <AnimatedCard
                sx={{
                  background: `linear-gradient(135deg, ${stat.color} 0%, ${theme.palette.background.paper} 100%)`,
                  border: `2px solid ${stat.color}`,
                  borderRadius: 3,
                  transition: theme.transitions.create(
                    ["transform", "box-shadow"],
                    {
                      duration: theme.transitions.duration.standard,
                      easing: theme.transitions.easing.easeInOut,
                    }
                  ),
                  willChange: "transform",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${stat.color}20`,
                        color: stat.color,
                        width: 56,
                        height: 56,
                        boxShadow: theme.shadows[4],
                        transition: theme.transitions.create("transform"),
                        "&:hover": {
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h4"
                        component="div"
                        sx={{ fontWeight: 700 }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>
      </Grow>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Submissions */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={800}>
            <AnimatedCard
              sx={{
                background: theme.palette.background.paper,
                height: "100%",
                minHeight: 400,
                transition: theme.transitions.create(
                  ["transform", "box-shadow"],
                  {
                    duration: theme.transitions.duration.standard,
                    easing: theme.transitions.easing.easeInOut,
                  }
                ),
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  Recent Submissions
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((submission, index) => (
                      <Slide
                        key={submission.submission_id || index}
                        in
                        direction="right"
                        timeout={(index + 1) * 200}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            borderRadius: 2,
                            gap: 2,
                            background: theme.palette.background.default,
                            transition: theme.transitions.create(
                              ["transform", "box-shadow"],
                              {
                                duration: theme.transitions.duration.shorter,
                                easing: theme.transitions.easing.easeOut,
                              }
                            ),
                            willChange: "transform",
                            "&:hover": {
                              transform: "scale(1.015)",
                              boxShadow: theme.shadows[3],
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 48,
                              height: 48,
                              fontSize: "1.2rem",
                              position: "relative",
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: 2,
                                right: 2,
                                width: 12,
                                height: 12,
                                bgcolor:
                                  Math.random() > 0.5
                                    ? "success.main"
                                    : "error.main",
                                borderRadius: "50%",
                                border: `2px solid ${theme.palette.background.paper}`,
                              },
                            }}
                          >
                            {submission.studentName.charAt(0)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {submission.studentName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {submission.assignmentTitle} • Submitted{" "}
                              {formatDistanceToNow(
                                new Date(submission.submission_date)
                              )}{" "}
                              ago
                            </Typography>
                            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                              {submission.file_url && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  href={submission.file_url}
                                  target="_blank"
                                  rel="noopener"
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    boxShadow: theme.shadows[2],
                                    transition:
                                      theme.transitions.create("box-shadow"),
                                    "&:hover": {
                                      boxShadow: theme.shadows[4],
                                    },
                                  }}
                                >
                                  View File
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Slide>
                    ))
                  ) : (
                    <Typography color="textSecondary">
                      No recent submissions found.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </AnimatedCard>
          </Fade>
        </Grid>

        {/* Courses List */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={1000}>
            <AnimatedCard
              sx={{
                background: theme.palette.background.paper,
                height: "100%",
                minHeight: 400,
                transition: theme.transitions.create(
                  ["transform", "box-shadow"],
                  {
                    duration: theme.transitions.duration.standard,
                    easing: theme.transitions.easing.easeInOut,
                  }
                ),
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  Your Courses
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {dashboardData.courses.map((course, index) => {
                    const courseTrack = course.tracks?.length
                      ? dashboardData.tracks.find((track) => track.id === course.tracks[0]?.id)
                      : null;
                    return (
                      <Grow key={course.id} in timeout={(index + 1) * 300}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            borderRadius: 2,
                            gap: 2,
                            background: theme.palette.background.default,
                            cursor: "pointer",
                            transition: theme.transitions.create(
                              ["transform", "box-shadow"],
                              {
                                duration: theme.transitions.duration.shorter,
                                easing: theme.transitions.easing.easeOut,
                              }
                            ),
                            willChange: "transform",
                            "&:hover": {
                              transform: "translateX(8px)",
                              boxShadow: theme.shadows[3],
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.secondary.main,
                              width: 56,
                              height: 56,
                              fontSize: "1.5rem",
                              position: "relative",
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: 2,
                                right: 2,
                                width: 12,
                                height: 12,
                                bgcolor: courseTrack?.online
                                  ? "success.main"
                                  : "error.main",
                                borderRadius: "50%",
                                border: `2px solid ${theme.palette.background.paper}`,
                              },
                            }}
                          >
                            <FiBook />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600 }}
                            >
                              {course.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {courseTrack?.name || "No Track Assigned"} •
                              Instructor: {courseTrack?.instructor || "Unknown"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Created:{" "}
                              {new Date(course.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grow>
                    );
                  })}
                </Box>
              </CardContent>
            </AnimatedCard>
          </Fade>
        </Grid>

        {/* All Assignments */}
        <Grid item xs={12}>
          <Fade in timeout={1200}>
            <AnimatedCard
              sx={{
                background: theme.palette.background.paper,
                transition: theme.transitions.create(
                  ["transform", "box-shadow"],
                  {
                    duration: theme.transitions.duration.standard,
                    easing: theme.transitions.easing.easeInOut,
                  }
                ),
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  All Assignments
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {dashboardData.assignments.length > 0 ? (
                    dashboardData.assignments.map((assignment, index) => (
                      <Grow key={assignment.id} in timeout={(index + 1) * 200}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            borderRadius: 2,
                            gap: 2,
                            background: theme.palette.background.default,
                            transition: theme.transitions.create(
                              ["transform", "box-shadow"],
                              {
                                duration: theme.transitions.duration.shorter,
                                easing: theme.transitions.easing.easeOut,
                              }
                            ),
                            willChange: "transform",
                            "&:hover": {
                              transform: "translateX(8px)",
                              boxShadow: theme.shadows[3],
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.warning.main,
                              width: 48,
                              height: 48,
                              fontSize: "1.2rem",
                            }}
                          >
                            <FiFileText />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {assignment.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Track: {assignment.trackName} • Course: {assignment.courseName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Due: {new Date(assignment.end_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grow>
                    ))
                  ) : (
                    <Typography color="textSecondary">
                      No assignments found.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </AnimatedCard>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OpeningPage;