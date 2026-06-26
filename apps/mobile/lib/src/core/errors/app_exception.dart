sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;

  @override
  String toString() => message;
}

final class NetworkException extends AppException {
  const NetworkException([
    super.message = 'Bağlantı hatası. Tekrar dener misin?',
  ]);
}

final class UnauthorizedException extends AppException {
  const UnauthorizedException([
    super.message = 'Oturumun sonlanmış. Tekrar giriş yap.',
  ]);
}

final class ValidationException extends AppException {
  const ValidationException([super.message = 'Girilen bilgileri kontrol et.']);
}

final class NotFoundException extends AppException {
  const NotFoundException([super.message = 'İçerik bulunamadı.']);
}

final class ServerException extends AppException {
  const ServerException([
    super.message = 'Bir şeyler ters gitti. Tekrar dener misin?',
  ]);
}
