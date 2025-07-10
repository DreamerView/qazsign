"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
    const pathname = usePathname();

    return (
        <header className="container-xl py-5 d-flex gap-3 flex-wrap align-items-center">
            <Link href="/">
                <img src="/logo.png" alt="logo" className="img-fluid" style={{maxWidth: "150px"}} />
            </Link>
            <div className="d-flex gap-3 ms-sm-auto">
                <Link 
                    className={`btn rounded-4 ${pathname === "/" ? "btn-primary" : "btn-outline-secondary border-0"}`} 
                    href="/"
                >
                    Информация о ЭЦП
                </Link>
                <Link 
                    className={`btn rounded-4 ${pathname === "/sign" ? "btn-primary" : "btn-outline-secondary border-0"}`} 
                    href="/sign"
                >
                    Подписать документ
                </Link>
            </div>
        </header>
    );
};

export default Header;