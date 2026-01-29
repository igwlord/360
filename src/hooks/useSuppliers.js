import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierRepository } from '../services/SupplierRepository';
import { PROVIDER_GROUPS_DATA } from '../data/initialData';

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, source } = await SupplierRepository.getAll();
      
      // Transformation Logic from DataContext
      let rawSuppliers = (source === 'remote' && data) ? data : [];
      
      if (rawSuppliers.length === 0 && source !== 'error') {
           return PROVIDER_GROUPS_DATA;
      }

      // Normalización de categorías de Directorio
      const normalizeCategory = (category) => {
          let cat = category || "General";
          if (cat === 'Frescos') cat = 'Perecederos';
          if (cat === 'Limpieza') cat = 'Perfumería & Limpieza';
          return cat;
      };

      // Grouping Logic
      const groups = rawSuppliers.reduce((acc, curr) => {
      const cat = normalizeCategory(curr.category);
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push({
            id: curr.id,
            company: curr.name,
            brand: curr.brand,
            name: curr.contact_name,
            role: curr.contact_role,
            email: curr.contact_email,
            phone: curr.contact_phone,
            website: curr.website,
            isFavorite: curr.is_favorite,
            // Schema mapping for UI consistency
            proveedor: curr.name, // Legacy UI support
            marca: curr.brand,    // Legacy UI support
            
            contacto_comercial_nombre: curr.contact_name,
            contacto_comercial_email: curr.contact_email,
            contacto_comercial_cel: curr.contact_phone,
            contacto_mkt_nombre: curr.contact_mkt_name,
            contacto_mkt_email: curr.contact_mkt_email,
            contacto_mkt_cel: curr.contact_mkt_phone,
            history: curr.history || [],
            groupId: `g-${curr.category}`
          });
          return acc;
        }, {});

        const grouped = Object.keys(groups).map((key, idx) => ({
          id: `g-${idx}`,
          title: key,
          contacts: groups[key],
        }));

        // Garantizar que exista la categoría "Nonfood" aunque todavía no tenga contactos
        if (!grouped.find(g => g.title === 'Nonfood')) {
            grouped.push({
                id: `g-nonfood`,
                title: 'Nonfood',
                contacts: []
            });
        }

        return grouped;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (Static-ish data)
  });
};

// Helper to map UI fields back to DB columns
const mapContactToDB = (contact) => {
    return {
        // ID & Group logic (groupTitle = nombre de categoría en UI, no cambiar al actualizar solo isFavorite)
        ...(contact.id && !contact.id.toString().startsWith('temp-') ? { id: contact.id } : {}),
        category: contact.groupTitle || contact.category || 'General',
        
        // Company (Handle legacy "proveedor" vs "company")
        name: contact.company || contact.proveedor,
        brand: contact.brand || contact.marca,
        website: contact.website,
        is_favorite: contact.isFavorite,

        // Commercial Contact
        contact_name: contact.contacto_comercial_nombre,
        contact_email: contact.contacto_comercial_email,
        contact_phone: contact.contacto_comercial_cel,

        // Marketing Contact
        contact_mkt_name: contact.contacto_mkt_nombre,
        contact_mkt_email: contact.contacto_mkt_email,
        contact_mkt_phone: contact.contacto_mkt_cel,

        // Extras
        history: contact.history || []
    };
};

export const useCreateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (contact) => {
            const dbPayload = mapContactToDB(contact);
            return SupplierRepository.create(dbPayload);
        },
        onSuccess: () => queryClient.invalidateQueries(['suppliers'])
    });
};

export const useUpdateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (contact) => {
             const dbPayload = mapContactToDB(contact);
             return SupplierRepository.update(dbPayload);
        },
        onSuccess: () => queryClient.invalidateQueries(['suppliers'])
    });
};

export const useDeleteContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => SupplierRepository.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['suppliers'])
    });
};
