import { Link } from "react-router-dom";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">الرجوع</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">اتصل بنا</span>
        </div>
      </header>
      <main className="container flex-1 py-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card/50 p-5">
          <h1 className="mb-3 text-xl font-bold text-foreground">اتصل بنا</h1>
          <p className="text-sm text-muted-foreground">
            للاستفسارات التجارية أو التبليغ عن انتهاك حقوق الملكية، يرجى التواصل معنا عبر:
          </p>
          <p className="mt-2 text-sm">
            <a href="mailto:support@dawrina.com" className="text-primary underline hover:text-primary/90">
              support@dawrina.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Contact;
