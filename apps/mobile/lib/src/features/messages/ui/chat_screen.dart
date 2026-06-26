import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../moderation/models/moderation.dart';
import '../../moderation/ui/moderation_sheet.dart';
import '../../../shared/widgets/v2_state_views.dart';
import '../models/dm_message.dart';
import '../providers/dm_chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.peerId});

  final String peerId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final body = _controller.text.trim();
    if (body.isEmpty) return;
    _controller.clear();
    await ref.read(dmChatProvider(widget.peerId).notifier).send(body);
  }

  @override
  Widget build(BuildContext context) {
    final chat = ref.watch(dmChatProvider(widget.peerId));

    ref.listen(dmChatProvider(widget.peerId), (previous, next) {
      final error = next.error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    final target = ModerationTarget(
      contentType: ReportContentType.profile,
      contentId: widget.peerId,
      userId: widget.peerId,
      label: '@${widget.peerId}',
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('@${widget.peerId}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            tooltip: 'Güvenlik seçenekleri',
            onPressed: () =>
                showModerationSheet(context, ref: ref, target: target),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: chat.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => V2ErrorState(message: error.toString()),
                data: (messages) => messages.isEmpty
                    ? const V2EmptyState(
                        icon: Icons.chat_bubble_outline,
                        title: 'Henüz mesajınız yok',
                      )
                    : ListView.separated(
                        reverse: true,
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        itemCount: messages.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: AppSpacing.sm),
                        itemBuilder: (_, index) {
                          final message = messages[messages.length - index - 1];
                          return _MessageBubble(message: message);
                        },
                      ),
              ),
            ),
            _Composer(controller: _controller, onSend: _send),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final DmMessage message;

  @override
  Widget build(BuildContext context) {
    final alignment =
        message.isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final color = message.isMine ? AppColors.pitRed : AppColors.surface2;
    final textColor =
        message.isMine ? AppColors.textPrimary : AppColors.textSecondary;

    return Column(
      crossAxisAlignment: alignment,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border:
                message.isMine ? null : Border.all(color: AppColors.surface3),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 280),
              child: Text(
                message.body,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: textColor),
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          DateFormat('HH:mm').format(message.createdAt),
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
        ),
      ],
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: AppColors.surface1,
        border: Border(top: BorderSide(color: AppColors.surface3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 4,
                maxLength: 2000,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: const InputDecoration(
                  hintText: 'Mesaj yaz',
                  counterText: '',
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            IconButton.filled(
              onPressed: onSend,
              icon: const Icon(Icons.send),
              tooltip: 'Gönder',
            ),
          ],
        ),
      ),
    );
  }
}
