/**
 * @layer shared
 * @segment api
 * @what OpenAPI生成物と HTTP ラッパーの集約
 *
 * shared は外部レイヤーに依存してはいけない（自己参照のみ）
 * HTTP通信は全てこのモジュール経由で行う
 */
export { apiClient, type ApiClientConfig } from './http';
export * from './generated';
