import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary
  static const Color primary = Color(0xFF2471D4);
  static const Color primaryDark = Color(0xFF1A56A0);
  static const Color primaryLight = Color(0xFF58A6FF);

  // Brand gold
  static const Color gold = Color(0xFFC8A84B);
  static const Color goldDim = Color(0xFFA8882E);

  // Semantic
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF0EA5E9);

  // Neutral
  static const Color background = Color(0xFF080C14);
  static const Color surface = Color(0xFF111827);
  static const Color surfaceVariant = Color(0xFF1C2128);
  static const Color border = Color(0xFF1E2D42);
  static const Color textPrimary = Color(0xFFE2E8F0);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textDisabled = Color(0xFF64748B);

  // Visit status
  static const Color statusCompleted = success;
  static const Color statusInProgress = warning;
  static const Color statusScheduled = primary;
  static const Color statusMissed = danger;
  static const Color statusCancelled = textDisabled;

  static Color statusColor(String status) {
    switch (status) {
      case 'completed': return statusCompleted;
      case 'in_progress': return statusInProgress;
      case 'scheduled': return statusScheduled;
      case 'missed': return statusMissed;
      default: return statusCancelled;
    }
  }
}
