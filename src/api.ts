import axios from 'axios';
import { StockItem } from './type';

export function fetchAllData(resolve: Function, stockCodes: string[]) {
  const baseUrl = 'https://api.money.126.net/data/feed/';

  axios
    .get(`${baseUrl}${stockCodes.join(',')}?callback=a`)
    .then(
      (rep) => {
        try {
          const result = JSON.parse(rep.data.slice(2, -2));
          const data: StockItem[] = [];
          Object.keys(result).map((item) => {
            if (!result[item].code) {
              result[item].code = item; //兼容港股美股
            }
            data.push(result[item]);
          });
          resolve(data);
        } catch (error) {}
      },
      (error) => {
        console.error(error);
      },
    )
    .catch((error) => {
      console.error(error);
    });
}
