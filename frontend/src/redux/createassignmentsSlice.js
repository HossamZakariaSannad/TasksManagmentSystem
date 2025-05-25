import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

const initialState = {
  tracks: [],
  courses: [],
  students: [],
  assignment: null,
  loading: false,
  error: null,
  success: false,
};

export const fetchTracks = createAsyncThunk(
  "assignments/fetchTracks",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/tracks/instructors/${userId}/available_tracks/`
      );
      return response.data;
    } catch (error) {
      console.error("fetchTracks error:", error);
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch tracks"
      );
    }
  }
);

export const fetchCourses = createAsyncThunk(
  "assignments/fetchCourses",
  async ({ userId, trackId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/staff/track-and-courses/${userId}/`);
      console.log("API Response:", response.data);

      // Get the courses from the most specific source available
      const rawCourses =
        response.data.taught_courses ||
        response.data.track_courses ||
        response.data.courses ||
        [];

      const courses = Array.isArray(rawCourses) ? rawCourses : [];

      // Normalize instructor field if needed
      const normalizedCourses = courses.map((course) => {
        if (typeof course.instructor === "string") {
          return {
            ...course,
            instructor: {
              name: course.instructor,
            },
          };
        }
        return course;
      });

      // Filter by track ID
      let filteredCourses = normalizedCourses.filter(
        (course) =>
          Array.isArray(course.tracks) &&
          course.tracks.some((track) => track.id === trackId)
      );

      console.log("Filtered Courses (before intake):", filteredCourses);

      // Fetch intake data
      const intakeResponse = await apiClient.get("/student/intakes/");
      const intakes = Array.isArray(intakeResponse.data.intakes)
        ? intakeResponse.data.intakes
        : [];

      const intakeCourses = {};

      await Promise.all(
        intakes.map(async (intake) => {
          try {
            const res = await apiClient.get(`/courses/intakes/${intake.id}/courses/`);
            intakeCourses[intake.id] = Array.isArray(res.data) ? res.data : [];
          } catch (err) {
            console.warn(`Failed to fetch courses for intake ${intake.id}:`, err);
            intakeCourses[intake.id] = [];
          }
        })
      );

      // Map courses to their intake (if applicable)
      filteredCourses = filteredCourses.map((course) => {
        let matchedIntake = null;
        for (const [intakeId, intakeCourseList] of Object.entries(intakeCourses)) {
          if (intakeCourseList.some((c) => c.id === course.id)) {
            const intakeObj = intakes.find((i) => i.id === parseInt(intakeId));
            if (intakeObj) {
              matchedIntake = { id: intakeObj.id, name: intakeObj.name };
              break;
            }
          }
        }
        return { ...course, intake: matchedIntake };
      });

      console.log("Filtered Courses (with intake):", filteredCourses);
      return filteredCourses;
    } catch (error) {
      console.error("fetchCourses error:", error);
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch courses"
      );
    }
  }
);

export const fetchStudents = createAsyncThunk(
  "assignments/fetchStudents",
  async ({ trackId, courseId, intakeId }, { rejectWithValue }) => {
    try {
      console.log("Fetching students with:", { trackId, courseId, intakeId });
      const response = await apiClient.get(
        `/student/tracks/${trackId}/courses/${courseId}/intakes/${intakeId}/students/`
      );
      console.log("fetchStudents API Response:", response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("fetchStudents error:", error);
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch students"
      );
    }
  }
);

export const createAssignment = createAsyncThunk(
  "assignments/createAssignment",
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        "/assignments/create/",
        assignmentData
      );
      return response.data;
    } catch (error) {
      console.error("createAssignment error:", error);
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create assignment"
      );
    }
  }
);

const assignmentSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    resetAssignmentState: (state) => {
      return { ...initialState };
    },
    clearStudents: (state) => {
      state.students = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tracks";
      })
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.courses = [];
        state.students = [];
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.courses = [];
        state.students = [];
        state.error = action.payload || "Failed to fetch courses";
      })
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.students = [];
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.students = [];
        state.error = action.payload || "Failed to fetch students";
      })
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.assignment = action.payload;
        state.success = true;
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create assignment";
        state.success = false;
      });
  },
});

export const { resetAssignmentState, clearStudents } = assignmentSlice.actions;
export default assignmentSlice.reducer;
