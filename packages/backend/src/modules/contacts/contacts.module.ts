import { Module } from '@nestjs/common';
import { ContactsController } from './controllers/contacts.controller';
import { ContactService } from './services/contact.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactsModule {}
