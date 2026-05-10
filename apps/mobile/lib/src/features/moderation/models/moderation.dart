enum ReportContentType {
  message('message'),
  flare('flare'),
  community('community'),
  profile('profile'),
  businessPin('business_pin');

  const ReportContentType(this.apiValue);

  final String apiValue;
}

enum ReportReason {
  spam('spam', 'Spam'),
  harassment('harassment', 'Taciz'),
  inappropriate('inappropriate', 'Uygunsuz içerik'),
  fake('fake', 'Sahte profil veya içerik'),
  other('other', 'Diğer');

  const ReportReason(this.apiValue, this.label);

  final String apiValue;
  final String label;
}

class ModerationTarget {
  const ModerationTarget({
    required this.contentType,
    required this.contentId,
    required this.label,
    this.userId,
  });

  final ReportContentType contentType;
  final String contentId;
  final String label;
  final String? userId;
}

class CreateReportDraft {
  const CreateReportDraft({
    required this.target,
    required this.reason,
    this.description,
  });

  final ModerationTarget target;
  final ReportReason reason;
  final String? description;

  Map<String, dynamic> toJson() {
    return {
      'content_type': target.contentType.apiValue,
      'content_id': target.contentId,
      'reason': reason.apiValue,
      if (description != null && description!.trim().isNotEmpty)
        'description': description!.trim(),
    };
  }
}
