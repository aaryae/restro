import { WEBSOCKET_URL } from "@/constants";
import { setSocketNewMessage } from "@/redux/feature/socketSlice";
import { getToken } from "@/utils/tokenHandler";
import { useRef, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
// import notificationSound from "@/assets/notification.mp3";

interface WebSocketHook {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
}

export default function useWebSocket(
  url: string = WEBSOCKET_URL,
): WebSocketHook {
  const dispatch = useDispatch();

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null); // To store the ping interval
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null); // To store pong timeout
  const [isSocketConnected, setSocketConnected] = useState(false);

  const token = getToken("token");

  const connect = () => {
    if (!socketRef.current) {
      socketRef.current = new WebSocket(url, [`Admin${token}`]);

      socketRef.current.onopen = () => {
        setSocketConnected(true);
      };

      socketRef.current.onmessage = (event) => {
        dispatch(setSocketNewMessage(event.data));

        // Handle Pong response to reset timeout
        if (event.data === "pong") {
          console.log("Received Pong from server");
          resetPongTimeout();
        }
      };

      socketRef.current.onerror = (error) => {
        console.log("Web socket error", error);
      };

      socketRef.current.onclose = () => {
        setSocketConnected(false);
        socketRef.current = null;
        clearInterval(pingIntervalRef.current as NodeJS.Timeout);
        clearTimeout(pongTimeoutRef.current as NodeJS.Timeout);
      };
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
      clearTimeout(pongTimeoutRef.current as NodeJS.Timeout);
    }
  };

  // Function to send ping message every interval
  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending Ping to server");
      socketRef.current.send("ping");
    }
  };

  // Function to reset pong timeout whenever pong is received
  const resetPongTimeout = () => {
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
    }

    pongTimeoutRef.current = setTimeout(() => {
      console.log("Pong timeout reached. Reconnecting...");
      disconnect();
      connect();
    }, 10000); // Reconnect after 10 seconds if pong is not received
  };

  useEffect(() => {
    if (isSocketConnected) {
      // Send ping every 30 seconds if connected
      pingIntervalRef.current = setInterval(sendPing, 30000);
    } else {
      // Clean up when socket is disconnected
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
    }

    return () => {
      // Clean up when the component is unmounted
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
      clearTimeout(pongTimeoutRef.current as NodeJS.Timeout);
    };
  }, [isSocketConnected]);

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.log("Socket is not connected to server");
    }
  };

  return {
    connect,
    disconnect,
    sendMessage,
  };
}
