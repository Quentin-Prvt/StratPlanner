import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient.ts'; // Vérifie ton import
import { useAuth } from '../contexts/AuthContext';

export type TeamRole = 'admin' | 'coach' | 'player' | 'guest';

export interface Team {
    id: string;
    name: string;
    tag: string;
    owner_id: string;
    invite_code?: string; // Nouveau champ
}

export interface TeamMember {
    id: string;
    user_id: string;
    role: TeamRole;
    profile: {
        username: string;
        avatar_url: string | null;
        email?: string;
    };
}

export const useTeam = () => {
    const { user } = useAuth();

    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [myRole, setMyRole] = useState<TeamRole | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTeam = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Chercher mon appartenance
            const { data: membership } = await supabase
                .from('team_members')
                .select('role, team_id, teams(*)')
                .eq('user_id', user.id)
                .maybeSingle();

            if (membership && membership.teams) {
                // @ts-ignore
                setTeam(membership.teams);
                // @ts-ignore
                setMyRole(membership.role);

                // 2. Récupérer les membres
                const { data: membersData } = await supabase
                    .from('team_members')
                    .select(`id, user_id, role, profile:profiles(username, avatar_url, email)`)
                    .eq('team_id', membership.team_id);
                // @ts-ignore
                setMembers(membersData || []);

                // PLUS AUCUNE REQUÊTE VERS team_invitations ICI -> FINI LES ERREURS 403
            } else {
                setTeam(null);
                setMembers([]);
                setMyRole(null);
            }
        } catch (error) {
            console.error("Erreur fetchTeam:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // --- ACTIONS ---

    const createTeam = async (name: string, tag: string) => {
        if (!user) return;
        // Création avec génération auto du invite_code par la DB
        const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert([{ name, tag, owner_id: user.id }])
            .select()
            .single();

        if (teamError) return { success: false, error: teamError.message };

        const { error: memberError } = await supabase
            .from('team_members')
            .insert([{ team_id: newTeam.id, user_id: user.id, role: 'admin' }]);

        if (memberError) return { success: false, error: memberError.message };

        await fetchTeam();
        return { success: true };
    };

    const joinTeamByCode = async (inviteCode: string) => {
        if (!user) return { success: false, error: "Non connecté" };

        // 1. Trouver l'équipe via le code
        const { data: teamFound, error: findError } = await supabase
            .from('teams')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();

        if (findError || !teamFound) return { success: false, error: "Code invalide ou équipe introuvable." };

        // 2. Rejoindre
        const { error: joinError } = await supabase
            .from('team_members')
            .insert([{ team_id: teamFound.id, user_id: user.id, role: 'player' }]);

        if (joinError) {
            if (joinError.code === '23505') return { success: false, error: "Vous êtes déjà dans cette équipe." };
            return { success: false, error: joinError.message };
        }

        await fetchTeam();
        return { success: true };
    };

    const leaveTeam = async () => {
        if (!user || !team) return;
        await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', user.id);
        await fetchTeam();
    };

    const updateMemberRole = async (memberId: string, newRole: TeamRole) => {
        await supabase.from('team_members').update({ role: newRole }).eq('id', memberId);
        await fetchTeam();
    };

    const kickMember = async (memberId: string) => {
        await supabase.from('team_members').delete().eq('id', memberId);
        await fetchTeam();
    };

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    return {
        team, members, myRole, loading,
        createTeam, leaveTeam, joinTeamByCode, // Nouvelle fonction
        updateMemberRole, kickMember, fetchTeam
    };
};