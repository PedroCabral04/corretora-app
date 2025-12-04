// Basic Flutter widget test
import 'package:flutter_test/flutter_test.dart';
import 'package:corretora_app/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    // Build the app and trigger a frame.
    await tester.pumpWidget(const CorretoraApp());

    // Verify login screen appears (default route is /login)
    expect(find.text('Entrar'), findsWidgets);
  });
}
