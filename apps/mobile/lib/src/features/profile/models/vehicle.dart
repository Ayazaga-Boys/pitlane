enum VehicleType {
  car('car', 'Otomobil'),
  motorcycle('motorcycle', 'Motosiklet'),
  other('other', 'Diğer');

  const VehicleType(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static VehicleType fromApiValue(String value) {
    return VehicleType.values.firstWhere(
      (type) => type.apiValue == value,
      orElse: () => VehicleType.other,
    );
  }
}

class Vehicle {
  const Vehicle({
    required this.id,
    required this.type,
    required this.make,
    required this.model,
    this.year,
    this.color,
    this.photoUrl,
    this.iconSlug,
    this.isPrimary = false,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      type: VehicleType.fromApiValue(
          json['type'] as String? ?? VehicleType.other.apiValue),
      make: json['make'] as String? ?? '',
      model: json['model'] as String? ?? '',
      year: json['year'] as int?,
      color: json['color'] as String?,
      photoUrl: json['photo_url'] as String?,
      iconSlug: json['icon_slug'] as String?,
      isPrimary: json['is_primary'] as bool? ?? false,
    );
  }

  final String id;
  final VehicleType type;
  final String make;
  final String model;
  final int? year;
  final String? color;
  final String? photoUrl;
  final String? iconSlug;
  final bool isPrimary;
}
