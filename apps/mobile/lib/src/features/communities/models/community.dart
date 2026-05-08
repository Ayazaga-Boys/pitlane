enum CommunityType {
  public('public', 'Herkese açık'),
  private('private', 'Özel'),
  secret('secret', 'Gizli');

  const CommunityType(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static CommunityType fromApiValue(String value) {
    return CommunityType.values.firstWhere(
      (type) => type.apiValue == value,
      orElse: () => CommunityType.public,
    );
  }
}

enum CommunityVehicleType {
  all('all', 'Hepsi'),
  car('car', 'Otomobil'),
  motorcycle('motorcycle', 'Motosiklet');

  const CommunityVehicleType(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static CommunityVehicleType fromApiValue(String value) {
    return CommunityVehicleType.values.firstWhere(
      (type) => type.apiValue == value,
      orElse: () => CommunityVehicleType.all,
    );
  }
}

class Community {
  const Community({
    required this.id,
    required this.name,
    required this.slug,
    required this.type,
    required this.vehicleType,
    required this.memberCount,
    required this.isVerified,
    this.description,
    this.city,
    this.coverUrl,
    this.lastActivityLabel,
  });

  factory Community.fromJson(Map<String, dynamic> json) {
    return Community(
      id: json['id'] as String? ?? json['slug'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      type: CommunityType.fromApiValue(
        json['type'] as String? ?? CommunityType.public.apiValue,
      ),
      vehicleType: CommunityVehicleType.fromApiValue(
        json['vehicle_type'] as String? ?? CommunityVehicleType.all.apiValue,
      ),
      city: json['city'] as String?,
      coverUrl: json['cover_url'] as String?,
      memberCount: json['member_count'] as int? ?? 0,
      isVerified: json['is_verified'] as bool? ?? false,
      lastActivityLabel: json['last_activity_label'] as String?,
    );
  }

  final String id;
  final String name;
  final String slug;
  final String? description;
  final CommunityType type;
  final CommunityVehicleType vehicleType;
  final String? city;
  final String? coverUrl;
  final int memberCount;
  final bool isVerified;
  final String? lastActivityLabel;
}

class CommunityFilters {
  const CommunityFilters({
    this.query = '',
    this.city = '',
    this.vehicleType = CommunityVehicleType.all,
  });

  final String query;
  final String city;
  final CommunityVehicleType vehicleType;

  CommunityFilters copyWith({
    String? query,
    String? city,
    CommunityVehicleType? vehicleType,
  }) {
    return CommunityFilters(
      query: query ?? this.query,
      city: city ?? this.city,
      vehicleType: vehicleType ?? this.vehicleType,
    );
  }
}

class CreateCommunityDraft {
  const CreateCommunityDraft({
    required this.name,
    required this.slug,
    required this.type,
    required this.vehicleType,
    this.description,
    this.city,
    this.coverUrl,
  });

  final String name;
  final String slug;
  final CommunityType type;
  final CommunityVehicleType vehicleType;
  final String? description;
  final String? city;
  final String? coverUrl;

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'slug': slug,
      'type': type.apiValue,
      'vehicle_type': vehicleType.apiValue,
      if (description != null && description!.isNotEmpty)
        'description': description,
      if (city != null && city!.isNotEmpty) 'city': city,
      if (coverUrl != null && coverUrl!.isNotEmpty) 'cover_url': coverUrl,
    };
  }
}
