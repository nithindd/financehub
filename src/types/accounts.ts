
import { Account as BaseAccount } from '@/actions/accounts'

export type PaymentMethodType = 'DEBIT_CARD' | 'CREDIT_CARD'

export interface PaymentMethod {
    id: string
    user_id: string
    account_id: string
    type: PaymentMethodType
    name: string
    last_four: string
    created_at: string
}

export interface AccountWithMethods extends BaseAccount {
    payment_methods: PaymentMethod[]
}
