import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Home() {
  const { token } = useAuth();

  return (
    <div className="bg-home min-h-screen bg-cover bg-forest-100 bg-center flex items-center">
      <div className="w-full md:w-8/12 lg:w-7/12 px-6 md:px-12 lg:px-16 py-12">
        <h1 className="font-ultra text-6xl md:text-8xl lg:text-9xl text-forest-950">
          <span className="relative z-10">Equilibra</span>
          <span className="relative z-0 -ml-6 md:-ml-11 top-6 md:top-10 text-forest-700">
            Fin
          </span>
        </h1>

        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-forest-800">
          Equilíbrio para suas finanças.
        </h2>

        <div className="mt-12 flex flex-col items-center sm:items-start">
          <Link
            to={token ? '/dashboard' : '/cadastro'}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FBFE34] px-8 py-4 text-lg font-bold text-forest-950 shadow-md transition duration-200 hover:bg-[#E8EB20] active:scale-95"
          >
            {token ? 'Abrir painel' : 'Criar minha conta'}
            <ArrowRight size={20} aria-hidden="true" />
          </Link>

          {!token && <p className="mt-4 text-sm text-forest-800 text-center sm:text-left">
            Já tem cadastro?{' '}
            <Link
              to="/login"
              className="font-semibold underline underline-offset-4 hover:text-forest-600"
            >
              Entre na sua conta
            </Link>
          </p>}
        </div>
      </div>
    </div>
  );
}
