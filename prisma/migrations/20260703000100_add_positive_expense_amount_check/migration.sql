ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_amount_positive_chk` CHECK (`amount` > 0);
