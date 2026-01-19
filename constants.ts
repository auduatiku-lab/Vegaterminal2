
import { Bond } from './types';

export const BONDS: Bond[] = [
  {
    id: 'NG-2030',
    name: 'NIGERIA 7.1430% 02/23/30',
    couponRate: 7.143,
    maturityDate: '2030-02-23',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'NG-2031',
    name: 'NIGERIA 8.747% 01/21/31',
    couponRate: 8.747,
    maturityDate: '2031-01-21',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'NG-2032',
    name: 'NIGERIA 7.875% 02/16/32',
    couponRate: 7.875,
    maturityDate: '2032-02-16',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'NG-2033',
    name: 'NIGERIA 7.375% 09/28/33',
    couponRate: 7.375,
    maturityDate: '2033-09-28',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'NG-2034-DEC',
    name: 'NIGERIA 10.375% 12/09/34',
    couponRate: 10.375,
    maturityDate: '2034-12-09',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'NG-2034-6',
    name: 'NIGERIA 6.375% 07/12/34',
    couponRate: 6.375,
    maturityDate: '2034-07-12',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'NG-2036',
    name: 'NIGERIA 8.6308% 01/13/36',
    couponRate: 8.6308,
    maturityDate: '2036-02-13',
    displayMaturity: '2036-01-13',
    frequency: 4,
    currency: 'USD'
  },
  {
    id: 'NG-2038',
    name: 'NIGERIA 7.696% 02/23/38',
    couponRate: 7.696,
    maturityDate: '2038-02-23',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'AO-2028',
    name: 'ANGOLA 8.250% 06/15/28',
    couponRate: 8.25,
    maturityDate: '2028-06-15',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'AO-2029',
    name: 'ANGOLA 8.000% 11/26/29',
    couponRate: 8.0,
    maturityDate: '2029-11-26',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'EG-2031',
    name: 'EGYPT 7.500% 02/16/31',
    couponRate: 7.5,
    maturityDate: '2031-02-16',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'ZA-2044',
    name: 'SOUTH AFRICA 5.875% 09/16/44',
    couponRate: 5.875,
    maturityDate: '2044-09-16',
    frequency: 2,
    currency: 'USD'
  },
  {
    id: 'KE-2028',
    name: 'KENYA 7.250% 02/28/28',
    couponRate: 7.25,
    maturityDate: '2028-02-28',
    frequency: 2,
    currency: 'USD'
  }
];

export const DEFAULT_SETTLEMENT = new Date().toISOString().split('T')[0];
