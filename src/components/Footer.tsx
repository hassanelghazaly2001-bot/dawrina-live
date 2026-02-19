import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border bg-card/60 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col items-start justify-between gap-3 py-4 sm:flex-row">
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} دورينا - DAWRINA. جميع الحقوق محفوظة.
        </div>
        <div className="flex items-center gap-4 text-xs">
          <a href="mailto:support@dawrina.com" className="text-primary hover:text-primary/90">
            support@dawrina.com
          </a>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground">
            اتصل بنا
          </Link>
          <Link to="/disclaimer" className="text-muted-foreground hover:text-foreground">
            إخلاء المسؤولية
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
