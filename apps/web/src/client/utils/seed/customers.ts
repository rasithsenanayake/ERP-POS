import type { CustomerSeed } from '../../data/customers';
import type { Customer, PaymentTerms } from '../../types/sales';
import { DAY } from '../dates';
import { sequenceLabel } from '../ids';
import { pick, randInt, Rng } from '../random';

export const salesTeam: Record<string, string[]> = {
  'br-col': ['u-tharushi', 'u-ruwan'],
  'br-kdy': ['u-dilshan', 'u-kasun'],
  'br-gal': ['u-sachini']
};

const sources = ['Walk-in', 'Walk-in', 'Referral', 'Website', 'Instagram', 'Facebook'];

function emailFor(seed: CustomerSeed): string {
  const [first, ...rest] = seed.name.toLowerCase().split(' ');
  const last = rest.join('').replace(/[^a-z]/g, '');
  if (seed.company) {
    const domain = seed.company.toLowerCase().replace(/\(pvt\) ltd/g, '').replace(/[^a-z]/g, '').slice(0, 18);
    return `${first}@${domain}.lk`;
  }
  return `${first}.${last}@gmail.com`;
}

export function buildCustomers(seeds: CustomerSeed[], rng: Rng, now: Date): Customer[] {
  return seeds.map((seed, index) => {
    const business = Boolean(seed.company);
    const createdAt = new Date(now.getTime() - randInt(rng, 120, 900) * DAY).toISOString();
    const wholesale = seed.tags.includes('Wholesale');
    const corporate = seed.tags.includes('Corporate');
    const terms: PaymentTerms = wholesale || corporate ? 'net_30' : 'due_on_receipt';
    const creditLimit = wholesale ? 150_000_000 : corporate ? 100_000_000 : seed.tags.includes('VIP') ? 30_000_000 : 0;
    const team = salesTeam[seed.branchId];
    return {
      id: `cus-${index + 1}`,
      number: sequenceLabel('CUS', index + 1),
      name: seed.name,
      company: seed.company ?? '',
      email: emailFor(seed),
      phone: seed.phone,
      secondaryPhone: '',
      address: business ? `${randInt(rng, 2, 220)} ${pick(rng, ['Galle Road', 'Duplication Road', 'Peradeniya Road', 'Main Street', 'Lighthouse Street'])}` : '',
      city: seed.city,
      type: business ? 'business' : 'individual',
      tags: seed.tags.length ? seed.tags : ['Retail'],
      source: wholesale || corporate ? 'Account manager' : pick(rng, sources),
      salespersonId: team[index % team.length],
      branchId: seed.branchId,
      creditLimit,
      paymentTerms: terms,
      taxId: business ? `${randInt(rng, 100000000, 999999999)}-7000` : '',
      loyaltyPoints: 0,
      createdAt,
      activity: [{ id: `cus-${index + 1}-created`, type: 'created', message: 'Customer created', userId: team[0], createdAt }],
      notes: []
    };
  });
}