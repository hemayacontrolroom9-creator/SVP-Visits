import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 48,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Text(
                '${user?['firstName']?[0] ?? ''}${user?['lastName']?[0] ?? ''}',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: theme.colorScheme.onPrimaryContainer),
              ),
            ),
            const SizedBox(height: 12),
            Text('${user?['firstName']} ${user?['lastName']}', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            Text(user?['email'] ?? '', style: TextStyle(color: Colors.grey.shade600)),
            const SizedBox(height: 4),
            Chip(label: Text(user?['role'] ?? ''), backgroundColor: theme.colorScheme.primaryContainer),
            const SizedBox(height: 24),
            Card(
              child: Column(
                children: [
                  ListTile(leading: const Icon(Icons.email_outlined), title: const Text('Email'), subtitle: Text(user?['email'] ?? '-')),
                  ListTile(leading: const Icon(Icons.phone_outlined), title: const Text('Phone'), subtitle: Text(user?['phone'] ?? '-')),
                  ListTile(leading: const Icon(Icons.badge_outlined), title: const Text('Role'), subtitle: Text(user?['role'] ?? '-')),
                ],
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text('Sign Out', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red)),
              onPressed: () => ref.read(authProvider.notifier).logout(),
            ),
          ],
        ),
      ),
    );
  }
}
