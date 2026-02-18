import { useContext } from 'react';
import SalesContext from './salesContextObject';

export const useSales = () => useContext(SalesContext);
