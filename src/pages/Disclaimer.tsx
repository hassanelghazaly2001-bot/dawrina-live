import { Link } from "react-router-dom";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">الرجوع</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">إخلاء المسؤولية</span>
        </div>
      </header>
      <main className="container flex-1 py-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card/50 p-5">
          <h1 className="mb-3 text-xl font-bold text-foreground">إخلاء المسؤولية</h1>
          <p className="text-sm text-muted-foreground">
            موقع DAWRINA لا يستضيف أي مقاطع فيديو على خوادمه. نحن نوفر روابط فقط إلى محتوى متاح على شبكة الإنترنت،
            وأي حقوق ملكية أو مسؤوليات تتعلق بذلك المحتوى تقع على عاتق الجهات المالكة له.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Disclaimer;
