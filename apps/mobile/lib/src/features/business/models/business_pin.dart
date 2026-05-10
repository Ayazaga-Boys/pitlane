class BusinessPin {
  const BusinessPin({
    required this.id,
    required this.name,
    required this.category,
    required this.h3Cell,
    this.ownerId,
    this.address,
    this.phone,
    this.website,
    this.logoUrl,
    this.coverUrl,
    this.isVerified = false,
    this.isActive = true,
    this.campaignText,
    this.campaignEndsAt,
  });

  factory BusinessPin.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;

    return BusinessPin(
      id: data['id'] as String? ?? '',
      ownerId: data['owner_id'] as String?,
      name: data['name'] as String? ?? 'İşletme',
      category: BusinessPinCategory.fromApiValue(data['category'] as String?),
      h3Cell: data['h3_cell'] as String? ?? '',
      address: data['address'] as String?,
      phone: data['phone'] as String?,
      website: data['website'] as String?,
      logoUrl: data['logo_url'] as String?,
      coverUrl: data['cover_url'] as String?,
      isVerified: data['is_verified'] as bool? ?? false,
      isActive: data['is_active'] as bool? ?? true,
      campaignText: data['campaign_text'] as String?,
      campaignEndsAt: DateTime.tryParse(
        data['campaign_ends_at'] as String? ?? '',
      ),
    );
  }

  final String id;
  final String? ownerId;
  final String name;
  final BusinessPinCategory category;
  final String h3Cell;
  final String? address;
  final String? phone;
  final String? website;
  final String? logoUrl;
  final String? coverUrl;
  final bool isVerified;
  final bool isActive;
  final String? campaignText;
  final DateTime? campaignEndsAt;

  bool get hasCampaign {
    if (campaignText == null || campaignText!.isEmpty) return false;
    final endsAt = campaignEndsAt;
    return endsAt == null || endsAt.isAfter(DateTime.now());
  }
}

enum BusinessPinCategory {
  garage('garage', 'Garaj'),
  repair('repair', 'Servis'),
  parts('parts', 'Parça'),
  fuel('fuel', 'Yakıt'),
  cafe('cafe', 'Kafe'),
  other('other', 'Diğer');

  const BusinessPinCategory(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static BusinessPinCategory fromApiValue(String? value) {
    for (final category in BusinessPinCategory.values) {
      if (category.apiValue == value) return category;
    }
    return BusinessPinCategory.other;
  }
}
