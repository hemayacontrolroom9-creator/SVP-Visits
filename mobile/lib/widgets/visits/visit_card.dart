import 'package:flutter/material.dart';
import '../../models/visit_model.dart';
import '../../theme/app_colors.dart';
import '../../utils/date_formatter.dart';

class VisitCard extends StatelessWidget {
  final VisitModel visit;
  final VoidCallback? onTap;
  final bool compact;

  const VisitCard({super.key, required this.visit, this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final statusColor = AppColors.statusColor(visit.status);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(compact ? 12 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      visit.siteName,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: statusColor.withOpacity(0.4)),
                    ),
                    child: Text(
                      visit.statusLabel,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.schedule, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(DateFormatter.formatTime(visit.scheduledAt), style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  const Spacer(),
                  if (visit.isGpsVerified)
                    const Icon(Icons.gps_fixed, size: 16, color: AppColors.success),
                  const SizedBox(width: 6),
                  if (visit.isQrVerified)
                    const Icon(Icons.qr_code_scanner, size: 16, color: AppColors.success),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
