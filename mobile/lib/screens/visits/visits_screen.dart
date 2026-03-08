import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/visits_provider.dart';
import '../../models/visit_model.dart';

class VisitsScreen extends ConsumerStatefulWidget {
  const VisitsScreen({super.key});

  @override
  ConsumerState<VisitsScreen> createState() => _VisitsScreenState();
}

class _VisitsScreenState extends ConsumerState<VisitsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visitsAsync = ref.watch(visitsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Visits'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Today'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(visitsProvider),
        child: visitsAsync.when(
          data: (visits) => TabBarView(
            controller: _tabController,
            children: [
              _VisitsList(visits: visits),
              _VisitsList(visits: visits.where((v) {
                final today = DateTime.now();
                return v.scheduledAt.year == today.year &&
                    v.scheduledAt.month == today.month &&
                    v.scheduledAt.day == today.day;
              }).toList()),
              _VisitsList(visits: visits.where((v) => v.isCompleted).toList()),
            ],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
        ),
      ),
    );
  }
}

class _VisitsList extends StatelessWidget {
  final List<VisitModel> visits;
  const _VisitsList({required this.visits});

  @override
  Widget build(BuildContext context) {
    if (visits.isEmpty) return const Center(child: Text('No visits found'));
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: visits.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, i) => _VisitListTile(visit: visits[i]),
    );
  }
}

class _VisitListTile extends StatelessWidget {
  final VisitModel visit;
  const _VisitListTile({required this.visit});

  Color get _statusColor {
    switch (visit.status) {
      case VisitStatus.completed: return Colors.green;
      case VisitStatus.in_progress: return Colors.orange;
      case VisitStatus.missed: return Colors.red;
      default: return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/visits/${visit.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 50,
                decoration: BoxDecoration(color: _statusColor, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(visit.site?['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(DateFormat('MMM dd, yyyy • h:mm a').format(visit.scheduledAt),
                        style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    if (visit.isGpsVerified || visit.isQrVerified)
                      Row(children: [
                        if (visit.isGpsVerified) ...[
                          Icon(Icons.gps_fixed, size: 12, color: Colors.green),
                          const SizedBox(width: 2),
                          const Text('GPS', style: TextStyle(fontSize: 10, color: Colors.green)),
                          const SizedBox(width: 6),
                        ],
                        if (visit.isQrVerified) ...[
                          Icon(Icons.qr_code, size: 12, color: Colors.green),
                          const SizedBox(width: 2),
                          const Text('QR', style: TextStyle(fontSize: 10, color: Colors.green)),
                        ],
                      ]),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _statusColor.withOpacity(0.4)),
                ),
                child: Text(
                  visit.status.name.replaceAll('_', ' '),
                  style: TextStyle(color: _statusColor, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
