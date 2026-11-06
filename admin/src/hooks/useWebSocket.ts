import { WEBSOCKET_URL } from "@/constants";
import { setSocketNewMessage } from "@/redux/feature/socketSlice";
import { getToken } from "@/utils/tokenHandler";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

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
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSocketConnected, setSocketConnected] = useState(false);

  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    clearTimers();
    setSocketConnected(false);
  }, [clearTimers]);

  const resetPongTimeout = useCallback(() => {
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
    }
    pongTimeoutRef.current = setTimeout(() => {
      disconnect();
    }, 10000);
  }, [disconnect]);

  const connect = useCallback(() => {
    const token = getToken("token");
    if (socketRef.current || !token) return;

    const socket = new WebSocket(url, [`Admin${token}`]);
    socketRef.current = socket;

    socket.onopen = () => {
      setSocketConnected(true);
    };

    socket.onmessage = (event) => {
      dispatch(setSocketNewMessage(event.data));
      if (event.data === "pong") {
        resetPongTimeout();
      }
    };

    socket.onerror = () => {
      // browser logs the underlying error; avoid noisy console spam
    };

    socket.onclose = () => {
      setSocketConnected(false);
      socketRef.current = null;
      clearTimers();
    };
  }, [clearTimers, dispatch, resetPongTimeout, url]);

  useEffect(() => {
    if (!isSocketConnected) {
      clearTimers();
      return;
    }

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send("ping");
      }
    }, 30000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [clearTimers, isSocketConnected]);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    }
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
  };
}
