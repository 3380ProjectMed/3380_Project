// Lightweight compatibility layer — re-export generic helpers from receptionistApi
import {
  apiRequestGlobal,
  getGlobal,
  postGlobal,
  putGlobal,
  delGlobal
} from './receptionistApi';

export const apiRequest = apiRequestGlobal;
export const get = getGlobal;
export const post = postGlobal;
export const put = putGlobal;
export const del = delGlobal;

export default {
  apiRequest,
  get,
  post,
  put,
  delete: del
};