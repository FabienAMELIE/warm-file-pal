// Application mono-utilisateur : plus de système de connexion.
// Toutes les données restent rattachées au compte historique.
export const OWNER_ID = "d6780491-e3e5-48e0-8dcb-673ef25d4380";
export const OWNER_EMAIL = "fabienamelie@hotmail.com";

export function useAuth() {
  return {
    session: null,
    user: { id: OWNER_ID, email: OWNER_EMAIL },
    loading: false,
    signOut: async () => {},
  };
}
