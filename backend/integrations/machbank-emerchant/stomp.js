"use strict";

/**
 * Minimal STOMP 1.2 frame encode/decode over a raw WebSocket.
 * NepalPAY QR websocket (/nqrws) speaks STOMP (CONNECT -> CONNECTED,
 * SUBSCRIBE, SEND), not plain JSON. See NCHL "NepalPAY QR Websocket" spec.
 */

const NULL = "\u0000";

function encodeFrame(command, headers = {}, body = "") {
  const headerLines = Object.entries(headers)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}:${v}`)
    .join("\n");
  return `${command}\n${headerLines}\n\n${body}${NULL}`;
}

/**
 * A single WebSocket message may contain one or more STOMP frames separated by
 * the NULL byte. Returns parsed frames; ignores heartbeat newlines.
 */
function decodeFrames(raw) {
  const text = typeof raw === "string" ? raw : raw.toString();
  const frames = [];

  for (const chunk of text.split(NULL)) {
    const trimmed = chunk.replace(/^\n+/, "");
    if (!trimmed.trim()) continue;

    const headerEnd = trimmed.indexOf("\n\n");
    if (headerEnd === -1) {
      // Command-only frame (rare) or malformed; capture command line.
      frames.push({ command: trimmed.trim(), headers: {}, body: "" });
      continue;
    }

    const head = trimmed.slice(0, headerEnd);
    const body = trimmed.slice(headerEnd + 2);
    const [command, ...headerLines] = head.split("\n");

    const headers = {};
    for (const line of headerLines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx);
      if (headers[key] === undefined) {
        headers[key] = line.slice(idx + 1);
      }
    }

    frames.push({ command: command.trim(), headers, body });
  }

  return frames;
}

module.exports = { encodeFrame, decodeFrames };
