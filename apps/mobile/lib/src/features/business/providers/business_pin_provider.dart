import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/business_pin_repository.dart';
import '../models/business_pin.dart';

class BusinessPinDetailNotifier
    extends FamilyAsyncNotifier<BusinessPin, String> {
  @override
  Future<BusinessPin> build(String arg) {
    return ref.read(businessPinRepositoryProvider).getBusinessPin(arg);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(businessPinRepositoryProvider).getBusinessPin(arg),
    );
  }
}

final businessPinDetailProvider = AsyncNotifierProvider.family<
    BusinessPinDetailNotifier,
    BusinessPin,
    String>(BusinessPinDetailNotifier.new);
