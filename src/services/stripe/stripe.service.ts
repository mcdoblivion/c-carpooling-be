import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'

@Injectable()
export class StripeService extends Stripe {
  constructor(private readonly config: ConfigService) {
    const stripeSecretKey = config.get<string>('STRIPE_SECRET_KEY')

    super(stripeSecretKey, {
      apiVersion: '2022-08-01',
    })
  }
}
