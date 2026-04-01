import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { authService } from '@/services/api/auth';
import type { LoginInput, RegisterInput, AuthResponse } from '@/services/api/auth';
import type { User, ClienteResponse } from '@/types/domain';

// Tipo que representa a resposta do registro: pode ser AuthResponse (com token) ou ClienteResponse (sem token)
type RegisterResponse = AuthResponse | ClienteResponse;

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);

  const handleLogin = async (data: LoginInput) => {
    try {
      const res = await authService.login(data);

      let loggedUser = res.user || res.cliente || res.usuario || res.prestador || res.colaborador;
      if (!loggedUser && res.usuario_id) {
        loggedUser = {
          id: res.usuario_id,
          nome: res.nome_completo || '',
          email: data.email,
        } as User;
      }

      if (!loggedUser) {
        throw new Error('Dados de usuário ausentes na resposta da API.');
      }

      login(res.access_token, res.refresh_token, loggedUser);
      addToast({ type: 'success', title: `Bem-vindo(a), ${loggedUser.nome.split(' ')[0]}!` });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (data: RegisterInput) => {
    let regRes: RegisterResponse;

    // 1. Tentar realizar o cadastro isoladamente
    // Qualquer exceção aqui é uma falha real na criação da conta
    try {
      regRes = await authService.register(data);
    } catch (error) {
      throw error;
    }

    // 2. Verifica se a resposta tem token (Cadastro via fluxo unificado que já loga)
    if ('access_token' in regRes && regRes.access_token) {
      let loggedUser = regRes.user || regRes.cliente || regRes.usuario || regRes.prestador || regRes.colaborador;
      if (!loggedUser && regRes.usuario_id) {
        loggedUser = {
          id: regRes.usuario_id,
          nome: regRes.nome_completo || `${data.nome} ${data.sobrenome}`,
          email: data.email,
        } as User;
      }
      if (!loggedUser) {
        // Fallback caso a API não retorne o user no shape esperado
        addToast({ type: 'success', title: 'Conta criada!', message: 'Faça login para continuar.' });
        return regRes;
      }
      
      login(regRes.access_token, regRes.refresh_token, loggedUser);
      addToast({ type: 'success', title: 'Conta criada com sucesso!' });
      return regRes;
    }

    // 3. Fluxo onde a conta FOI CRIADA (200 OK), mas retorna apenas o payload do Cliente
    const cliente = regRes as unknown as ClienteResponse;
    const loggedUser: User = {
      id: cliente.id,
      nome: cliente.nome_completo || `${cliente.nome} ${cliente.sobrenome}`.trim(),
      email: cliente.email,
    };

    // 4. Tentativa de Auto-login isolada
    // Se isso falhar, o cadastro continua sendo considerado sucesso pelo frontend.
    try {
      const loginRes = await authService.login({ email: data.email, senha: data.senha });

      let loginUser = loginRes.user || loginRes.cliente || loginRes.usuario || loginRes.prestador || loginRes.colaborador;
      if (!loginUser && loginRes.usuario_id) {
        loginUser = {
          id: loginRes.usuario_id,
          nome: loginRes.nome_completo || loggedUser.nome,
          email: data.email,
        } as User;
      }

      if (!loginUser || !loginRes.access_token) {
        throw new Error('Dados de usuário ausentes na resposta do login.');
      }

      login(loginRes.access_token, loginRes.refresh_token, loginUser);
      addToast({ type: 'success', title: `Bem-vindo(a), ${loginUser.nome.split(' ')[0]}!` });
      return { ...regRes, login: loginRes };
    } catch (loginError) {
      // Ocorreu erro APENAS no auto-login (ex: timeout). O cadastro FUNCIONOU.
      addToast({
        type: 'success',
        title: 'Conta criada!',
        message: 'Faça login manualmente para acessar sua conta.',
      });
      return regRes;
    }
  };

  const handleLogout = () => {
    logout();
    addToast({ type: 'info', title: 'Você saiu da sua conta.' });
  };

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateUser,
  };
}