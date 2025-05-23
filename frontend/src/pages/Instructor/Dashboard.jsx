import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiBook,
  FiCalendar,
  FiAward,
  FiClipboard,
  FiMessageCircle,
  FiUploadCloud,
} from "react-icons/fi";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MyCourses from "../../Components/MyCourses/MyCourses";
import Assignments from "../../Components/Assignments/Assignments";
import Submissions from "../../Components/Submissions/Submissions";
import Grades from "../../Components/Grades/Grades";
import CreateAssignment from "../../Components/CreateAssignments/CreateAssignments";
import OpeningPage from "./OpeningPage";
import ChatRoomView from '../../Components/Chat/ChatRoomView';
import ChatRoomList from '../../Components/Chat/ChatRoomList';

const DashboardContainer = styled(Box)({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: (theme) => theme.palette.background.default,
});

const SidebarWrapper = styled(Box)(({ theme, open }) => ({
  width: open ? 340 : 74,
  height: "100vh",
  position: "sticky",
  top: 0,
  transition: theme.transitions.create("width"),
  backgroundColor: "#1e1e1e", // Changed to #1e1e1e
  boxShadow: theme.shadows[4],
  zIndex: theme.zIndex.appBar,
  color: theme.palette.common.white, // Ensure text/icons are readable
  "& svg": {
    color: theme.palette.common.white, // Ensure icons are white
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.grey[700]}`, // Darker divider for contrast
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const MenuItem = styled(Link)(({ theme, active }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 2),
  margin: theme.spacing(0.5, 1.5),
  borderRadius: theme.shape.borderRadius,
  color: active ? theme.palette.primary.main : theme.palette.grey[300], // Lighter text for contrast
  backgroundColor: active ? theme.palette.grey[800] : "transparent", // Darker active background
  textDecoration: "none",
  transition: theme.transitions.create(["background-color", "color"]),
  "&:hover": {
    backgroundColor: theme.palette.grey[700], // Dark hover effect
    color: theme.palette.primary.main,
  },
  "& svg": {
    marginRight: theme.spacing(1.5),
    flexShrink: 0,
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  maxWidth: 1440,
  margin: "0 auto",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const ContentCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  padding: theme.spacing(3),
  minHeight: "calc(100vh - 96px)",
}));

const InstructorDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setSidebarOpen(true);
  }, [username]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const menuItems = [
    {
      text: "Dashboard",
      icon: <FiBook size={20} />,
      path: "/instructor/dashboard/",
    },
    {
      text: "My Courses",
      icon: <FiBook size={20} />,
      path: "/instructor/dashboard/courses",
    },
    {
      text: "Assignments",
      icon: <FiCalendar size={20} />,
      path: "/instructor/dashboard/assignments",
    },
    {
      text: "Create Assignment",
      icon: <FiClipboard size={20} />,
      path: "/instructor/dashboard/create-assignment",
    },
    {
      text: "Submissions",
      icon: <FiUploadCloud size={20} />,
      path: "/instructor/dashboard/submissions",
    },
    {
      text: "Grades & Feedbacks",
      icon: <FiAward size={20} />,
      path: "/instructor/dashboard/grades",
    },
    {
      text: "Chat",
      icon: <FiMessageCircle />,
      path: "/instructor/dashboard/chat",
    },
  ];
  const displayName = username ? username.split("@")[0] : "Instructor";

  return (
    <DashboardContainer>
      <SidebarWrapper open={sidebarOpen}>
        <SidebarHeader>
          {sidebarOpen ? (
            <>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="grey.400" // Lighter for contrast
                  gutterBottom
                >
                  Welcome back,
                </Typography>
                <Typography variant="h6" color="primary">
                  {displayName}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setSidebarOpen(false)}
                size="small"
                sx={{ color: "grey.300" }} // Lighter icon
              >
                <FiX size={18} />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() => setSidebarOpen(true)}
              size="small"
              sx={{ color: "grey.300" }}
            >
              <FiMenu size={18} />
            </IconButton>
          )}
        </SidebarHeader>

        <Box py={1}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <MenuItem
                key={item.text}
                to={item.path}
                active={isActive ? 1 : 0}
                onClick={() => !sidebarOpen && setSidebarOpen(true)}
              >
                {item.icon}
                {sidebarOpen && (
                  <Typography variant="body2">{item.text}</Typography>
                )}
              </MenuItem>
            );
          })}
        </Box>
      </SidebarWrapper>

      <MainContent>
        <ContentCard>
          <Routes>
            <Route index element={<OpeningPage />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="create-assignment" element={<CreateAssignment />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="grades" element={<Grades />} />
            <Route path="chat" element={<ChatRoomList />} />
            <Route path="chat/rooms/:roomId" element={<ChatRoomView />} />
          </Routes>
        </ContentCard>
      </MainContent>
    </DashboardContainer>
  );
};

export default InstructorDashboard;
