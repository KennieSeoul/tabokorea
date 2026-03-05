export const metadata = {
  title: "KRX Market Map",
  description: "WICS 3-level Heatmap for Korean Stock Market",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
