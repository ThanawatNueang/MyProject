// src/utils/search-util.js
import { Op } from 'sequelize';

export const MAX_LIMIT = 20;

export const sanitize = (q) => {
  if (q == null) return '';
  if (Array.isArray(q)) q = q[0];
  return String(q).trim().slice(0, 50);
};

export function buildWhereForTerms(q) {
  const terms = q.split(/\s+/).filter(Boolean);
  if (!terms.length) return null;

  return {
    [Op.and]: terms.map((t) => {
      const prefix = `${t}%`;
      const part   = `%${t}%`;
      return {
        [Op.or]: [
          { name: { [Op.like]: prefix } },  // prefix
          { name: { [Op.like]: part } },    // substring
        ],
      };
    }),
  };
}

/** ค้นหาเฉพาะคอลัมน์ name เท่านั้น */
export async function baseSuggest(Model, q, limit = 10) {
  const value = sanitize(q);
  if (!value) return [];

  const where = buildWhereForTerms(value);

  const rows = await Model.findAll({
    where: { ...(where || {}) },
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
    limit: Math.min(Number(limit) || 10, MAX_LIMIT),
  });

  return rows.map((r) => ({ id: r.id, name: r.name }));
}
