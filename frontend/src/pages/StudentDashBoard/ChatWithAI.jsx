import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { FiSend } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import "./ChatWithAI.css";

// Define available models
const AVAILABLE_MODELS = [
  { value: "deepseek-ai/DeepSeek-V3", label: "DeepSeek-V3" },
  { value: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", label: "Llama-4-Maverick-17B" },
  { value: "deepseek-ai/DeepSeek-R1", label: "DeepSeek-R1" },
  { value: "Qwen/Qwen2.5-VL-72B-Instruct", label: "Qwen2.5-VL-72B" },
  { value: "meta-llama/Llama-4-Scout-17B-16E-Instruct", label: "Llama-4-Scout-17B" },
];

const ChatWithAI = () => {
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].value);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatBoxRef = useRef(null);

  console.log("ChatWithAI Component Rendered");

  const sendMessage = useCallback(async () => {
    console.log("sendMessage called, input:", input, "model:", selectedModel, "imageUrl:", imageUrl);
    if (!input.trim()) {
      setError("Please enter a message");
      console.log("Empty input detected");
      return;
    }

    // Add user message to history
    const userMessage = {
      role: "user",
      content: imageUrl
        ? `${input}<br /><small>Image URL: ${imageUrl}</small>`
        : input,
      id: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setImageUrl("");
    setLoading(true);
    setError("");

    try {
      console.log("Sending API request:", { message: input, model: selectedModel, image_url: imageUrl });
      const res = await fetch("https://task-project-backend-1hx7.onrender.com/api/chatAI/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          ...(imageUrl && { image_url: imageUrl }),
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      console.log("AI Response:", data);

      if (data.error) {
        // Handle rate limit error specifically
        if (data.error.includes("rate limit")) {
          throw new Error(
            "Rate limit reached for this model. Please wait a moment and try again."
          );
        }
        throw new Error(data.error);
      }

      // Clean response: remove markdown symbols
      const cleanResponse = data.response
        .replace(/#{1,6}\s*/g, "")
        .replace(/\*\*\*/g, "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[-*+]\s/g, "• ")
        .replace(/\n/g, "<br />");

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `${cleanResponse}<br /><small>Model: ${data.model_used}</small>`,
          id: Date.now() + 1,
        },
      ]);
    } catch (err) {
      console.error("Chat Error:", err);
      setError(err.message); // Display the error without retrying
    } finally {
      setLoading(false);
    }
  }, [input, selectedModel, imageUrl]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    console.log("ChatWithAI Mounted");
    return () => console.log("ChatWithAI Unmounted");
  }, []);

  return (
    <Box className="chat-container">
      <Card
        elevation={3}
        sx={{ borderTop: "4px solid #1976d2", height: "100%" }}
      >
        <CardHeader
          title="Chat With AI"
          avatar={<FaRobot style={{ color: "#1976d2" }} />}
          subheader="Your intelligent assistant"
        />
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100% - 64px)",
          }}
        >
          <Box
            className="chat-box"
            ref={chatBoxRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              mb: 2,
              p: 2,
              backgroundColor: "#f5f5f5",
              borderRadius: 1,
            }}
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && !loading && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ mt: 4 }}
              >
                Start a conversation by typing a message below.
              </Typography>
            )}
            {messages.map((msg) => (
              <Box
                key={msg.id}
                className={`message ${msg.role}`}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: "70%",
                    p: 2,
                    borderRadius: 2,
                    backgroundColor:
                      msg.role === "user" ? "#1976d2" : "#ffffff",
                    color: msg.role === "user" ? "#ffffff" : "#000000",
                    boxShadow: 1,
                  }}
                >
                  {msg.role === "ai" && (
                    <Avatar sx={{ bgcolor: "#1976d2", mr: 1, float: "left" }}>
                      <FaRobot />
                    </Avatar>
                  )}
                  <Typography
                    variant="body1"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                    sx={{ display: "inline", wordBreak: "break-word" }}
                  />
                </Box>
              </Box>
            ))}
            {loading && (
              <Box
                className="message ai"
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <Avatar sx={{ bgcolor: "#1976d2", mr: 1 }}>
                  <FaRobot />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Typing...
                </Typography>
              </Box>
            )}
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            className="input-area"
            sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
          >
            <FormControl sx={{ minWidth: 150 }} disabled={loading}>
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                value={selectedModel}
                label="Model"
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  console.log("Model changed:", e.target.value);
                }}
              >
                {AVAILABLE_MODELS.map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    {model.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ask anything..."
              variant="outlined"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                console.log("Input changed:", e.target.value);
              }}
              onKeyDown={(e) => {
                console.log("Key pressed:", e.key);
                if (e.key === "Enter") sendMessage();
              }}
              sx={{ flex: 1, minWidth: 200 }}
              aria-label="Type your message"
              disabled={loading}
            />
            <TextField
              label="Image URL (optional)"
              variant="outlined"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                console.log("Image URL changed:", e.target.value);
              }}
              sx={{ flex: 1, minWidth: 200 }}
              aria-label="Image URL"
              disabled={loading || selectedModel !== "Qwen/Qwen2.5-VL-72B-Instruct"}
              placeholder="Only for Qwen2.5-VL"
            />
            <Button
              variant="contained"
              startIcon={<FiSend />}
              onClick={() => {
                console.log("Send button clicked");
                sendMessage();
              }}
              disabled={loading || !input.trim()}
              sx={{
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#00796b" },
              }}
              aria-label="Send message"
            >
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatWithAI;