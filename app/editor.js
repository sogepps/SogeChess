import { Redirect, useLocalSearchParams } from 'expo-router';

/** Eski konum düzenleyici rotası Studio'ya yönlendirilir. */
export default function EditorRedirect() {
  const params = useLocalSearchParams();
  const fen = params.fen ? `&fen=${encodeURIComponent(String(params.fen))}` : '';
  const id = params.id ? `&id=${encodeURIComponent(String(params.id))}` : '';
  return <Redirect href={`/studio?mode=setup${fen}${id}`} />;
}
