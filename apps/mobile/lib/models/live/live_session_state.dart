/// Live stream session lifecycle states for host and viewer
enum LiveSessionState {
  /// Session has not started or has been completely reset
  idle,

  /// Establishing RTC channel and API connections
  connecting,

  /// Actively streaming (host broadcasting or viewer receiving)
  active,

  /// Session termination in progress, releasing hardware and syncing backend
  ending,

  /// Session successfully ended and hardware resources released
  ended,

  /// Session failed due to critical error or rejected permissions
  failed,

  /// Network connection dropped during active stream
  disconnected,
}
