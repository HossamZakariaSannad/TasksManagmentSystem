import React from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Home,
  FileText,
  LogOut,
  User,
  Settings,
  Bell,
  Plus,
  Grid,
  Users as UsersIcon,
  BookOpen,
  BarChart2,
  ClipboardList,
  Briefcase,
  Info,
  Menu as MenuIcon,
  LogIn,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { styled } from "@mui/material/styles";

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  textTransform: "none",
  fontWeight: 500,
  fontSize: "0.875rem",
  margin: theme.spacing(0, 0.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&.active": {
    backgroundColor: "#1976d2",
    color: theme.palette.getContrastText("#1976d2"),
  },
}));

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, username, role } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const open = Boolean(anchorEl);

  const commonNavItems = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/services", label: "Services", icon: <Briefcase size={18} /> },
    { path: "/about", label: "AboutUs", icon: <Info size={18} /> },
  ];

  const roleSpecificNavItems = () => {
    switch (role) {
      case "instructor":
        return [
          {
            path: "/instructor/dashboard",
            label: "My Dashboard",
            icon: <ClipboardList size={18} />,
          },
        ];
      case "supervisor":
        return [
          {
            path: "/supervisor/dashboard",
            label: "Supervisor Dashboard",
            icon: <BarChart2 size={18} />,
          },
        ];
      case "student":
        return [
          {
            path: "/student/dashboard?section=courses",
            label: "My Courses",
            icon: <BookOpen size={18} />,
          },
          {
            path: "/student/dashboard?section=assignments",
            label: "Assignments",
            icon: <FileText size={18} />,
          },
        ];
      case "branch_manager":
        return [
          {
            path: "/branchmanager/dashboard",
            label: "Branch Dashboard",
            icon: <Grid size={18} />,
          },
        ];
      case "admin":
        return [
          {
            path: "/admin/dashboard",
            label: "Dashboard",
            icon: <BarChart2 size={18} />,
          },
        ];
      default:
        return [];
    }
  };

  const allNavItems = [
    ...commonNavItems,
    ...(token ? roleSpecificNavItems() : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate("/signin");
  };

  const drawerContent = (
    <Box
      sx={{
        width: 250,
        height: "100%",
        pt: 2,
        background:
          "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)",
      }}
    >
      <List>
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="white">
            Main Menu
          </Typography>
        </Box>
        {commonNavItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              color: "white",
              "&.active": {
                backgroundColor: "#1976d2",
                color: "white",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}

        {token && (
          <>
            <Box sx={{ px: 2, mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                My Account
              </Typography>
            </Box>
            {roleSpecificNavItems().map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                onClick={handleDrawerToggle}
                sx={{
                  color: "white",
                  "&.active": {
                    backgroundColor: "#1976d2",
                    color: "white",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          bgcolor: "rgba(18, 18, 18, 0.95)",
          background:
            "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: "#1976d2",
              textDecoration: "none",
              display: { xs: "none", md: "contents" },
              "&:hover": {
                color: "#155da4",
              },
            }}
          >
            TaskPilot
          </Typography>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              marginLeft: "1rem",
              gap: 1,
            }}
          >
            {allNavItems.map((item) => (
              <NavButton
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
              >
                {item.label}
              </NavButton>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginLeft: "auto", // Ensures right alignment
            }}
          >
            {token ? (
              <>
                <IconButton onClick={handleProfileMenuOpen} size="small">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "#1976d2",
                      color: "white",
                    }}
                  >
                    {username?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: "visible",
                      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                      mt: 1.5,
                      bgcolor: "#2d2d2d",
                      color: "white",
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      "&:before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: "#2d2d2d",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                      },
                    },
                  }}
                >
                  <MenuItem onClick={() => navigate("/profile")}>
                    <ListItemIcon>
                      <User size={20} />
                    </ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                  </MenuItem>
                  <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.12)" }} />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogOut size={20} />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={Link}
                to="/signin"
                variant="text"
                sx={{ color: "white" }}
                startIcon={<LogIn size={18} />}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 240,
            background:
              "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)",
            borderRight: "1px solid rgba(255, 255, 255, 0.12)",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Navbar;
